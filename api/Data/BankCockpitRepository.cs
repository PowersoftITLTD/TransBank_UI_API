using Advantis.BankCockpit.Api.Contracts;
using Advantis.BankCockpit.Api.Model;
using Azure;
using Dapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Identity.Client;
using System.Data;
using System.Security.Cryptography.Xml;

namespace Advantis.BankCockpit.Api.Data;

public interface IBankCockpitRepository
{
    Task<CommonObjResponse> GetBalancesAsync(int? userId, CancellationToken ct);
    Task<CommonObjResponse?> GetStatementAsync(jsonEncryptModel jsonEncrypt, int? userId, CancellationToken ct);  //AccStatement accStatement   ,jsonEncryptModel jsonEncrypt
    Task<CommonObjResponse> GetAlertsAsync(bool includeResolved, int? userId, CancellationToken ct);
    Task<CommonObjResponse> AcknowledgeAlertAsync(Guid alertId, string acknowledgedBy, CancellationToken ct);
    Task<int> RegenerateAlertsAsync(CancellationToken ct);
}

public sealed class BankCockpitRepository : IBankCockpitRepository
{
    private readonly IDbConnectionFactory _factory;
    private readonly IAuthRepository _authRepository;
    private readonly ICommonService _commonService;

    public BankCockpitRepository(IDbConnectionFactory factory ,IAuthRepository authRepository ,ICommonService commonService)
    {
        _factory = factory;
        _authRepository = authRepository;
        _commonService = commonService;
    } 
    public async Task<CommonObjResponse> GetBalancesAsync(int? userId, CancellationToken ct)
    {
        var objresponse = new CommonObjResponse();
        try
        {
            var appsettingConfig = await _commonService.GetAppSetting_ConfigDetails();
            var appConfig = appsettingConfig.Data as AppConfig_Model;
            if (appConfig == null || string.IsNullOrWhiteSpace(appConfig.EncryptionKey))
            {
                objresponse.Status = "Error";
                objresponse.Message = "Encryption key is missing in the application configuration..";
                return (objresponse);
            }
            //var loginecrypt = _authRepository.EncryptionObje<int?>(userId, appConfig.EncryptionKey);
            using var db = _factory.Create();
            //userId = 1;

            var rows = await db.QueryAsync<BalanceRow>(new CommandDefinition(
                "bank.usp_GetBalances",
                new { UserId = userId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));

            var sync = await db.QuerySingleOrDefaultAsync<SyncRow>(new CommandDefinition(
                "bank.usp_GetLastSync",
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));

            var accounts = rows.Select(r => new BankAccountDto(
                Id: r.AccountPublicId,
                EntityId: r.EntityPublicId,
                EntityName: r.EntityName,
                ProjectId: r.ProjectPublicId,
                ProjectName: r.ProjectName,
                BankName: r.BankName,
                AccountNumber: r.AccountNumberMasked,
                Purpose: r.Purpose,
                CurrencyCode: r.CurrencyCode,
                OverdraftLimit: r.OverdraftLimit,
                BankBalance: r.BankBalance ?? 0m,
                BankBalanceAsOf: r.BankBalanceAsOf,
                FeedSource: r.FeedSource,
                StatementClosingBalance: r.StatementClosingBalance ?? 0m,
                BookBalance: r.BookBalance ?? 0m,
                LastRecoDate: r.LastRecoDate,
                ChequesNotPresented: r.ChequesNotPresented ?? 0m,
                DepositsInTransit: r.DepositsInTransit ?? 0m,
                ExpectedBook: r.ExpectedBook ?? 0m,
                UnexplainedBreak: r.UnexplainedBreak ?? 0m,
                UnclearedFunds: r.UnclearedFunds ?? 0m,
                Status: r.RecoStatus,
                FeedStatus: r.FeedStatus,
                FeedAgeMinutes: r.FeedAgeMinutes ?? 0,
                IsUnmapped: r.IsUnmapped)).ToList();

            // The header shows when the pipeline last delivered, which is the
            // aggregator run if there is one and the last row received otherwise.
            if (accounts == null || accounts.Count == 0)
            {
                objresponse.Status = "Error";
                objresponse.Message = "No account details were found.";
                objresponse.Data = null;
                return objresponse;
            }
            var lastSync = sync?.AggregatorLastSyncAt ?? sync?.LastBalanceReceivedAt;
            var balanceResponse = new BalancesResponse(
                LastSyncAt: lastSync,
                Accounts: accounts);
            var encryptedData = balanceResponse != null ? _authRepository.EncryptionObje<BalancesResponse>(balanceResponse, appConfig.EncryptionKey) : string.Empty;
            var userDeEncryptedDetails = _authRepository.DecryptObject<BalancesResponse>(encryptedData, appConfig.EncryptionKey);
            if (string.IsNullOrWhiteSpace(encryptedData))
            {
                objresponse.Status = "Error";
                objresponse.Message = "Unable to encrypt account details.";
                objresponse.Data = null;
                return objresponse;
            }
            objresponse.Status = "Success";
            objresponse.Message = "Account details retrieved successfully.";
            objresponse.Data = encryptedData;
            return objresponse;
            //return new BalancesResponse(lastSync, accounts);

        }
        catch(Exception ex)
        {
            objresponse.Status = "Error";
            objresponse.Message = $"An error occurred while retrieving account details.; {ex.Message}";
            objresponse.Data = null;
            return objresponse;
        }
    }
    public async Task<CommonObjResponse?> GetStatementAsync(jsonEncryptModel jsonEncrypt, int? userId, CancellationToken ct)  //AccStatement accStatement   ,jsonEncryptModel jsonEncrypt
    {
        var objresponse = new CommonObjResponse();
        try
        {
            if (jsonEncrypt == null || string.IsNullOrEmpty(jsonEncrypt.jsonEncrypt))
            {
                objresponse.Status = "Error";
                objresponse.Message = "Invalid request. Please provide the required data.";
                return (objresponse);
            }
            var appsettingConfig = await _commonService.GetAppSetting_ConfigDetails();
            var appConfig = appsettingConfig.Data as AppConfig_Model;
            if (appConfig == null || string.IsNullOrWhiteSpace(appConfig.EncryptionKey))
            {
                objresponse.Status = "Error";
                objresponse.Message ="Encryption key is missing in the application configuration.";
                objresponse.Data = null;
                return objresponse;
            }

            //var loginecrypt = _authRepository.EncryptionObje<AccStatement>(accStatement, appConfig.EncryptionKey);
            var accStatement = _authRepository.DecryptObject<AccStatement>(jsonEncrypt.jsonEncrypt, appConfig.EncryptionKey);
            //var userModel = _authRepository.DecryptObject<AccStatement>(loginecrypt, appConfig.EncryptionKey);



            using var db = _factory.Create();

            using var grid = await db.QueryMultipleAsync(new CommandDefinition(
            "bank.usp_GetStatement",
            new
            {
                AccountPublicId = accStatement.AccountId,
                FromDate = string.IsNullOrWhiteSpace(accStatement.From) ? (DateOnly?)null: DateOnly.Parse(accStatement.From),
                ToDate = string.IsNullOrWhiteSpace(accStatement.To) ? (DateOnly?)null: DateOnly.Parse(accStatement.To),
                //ToDate = Convert.ToDateTime(accStatement.To),
                MaxRows = 200,
                UserId = userId,

                //FromDate = from.HasValue ? from.Value.ToDateTime(TimeOnly.MinValue) : (DateTime?)null,
                //ToDate = to.HasValue ? to.Value.ToDateTime(TimeOnly.MinValue) : (DateTime?)null,
            },
            commandType: CommandType.StoredProcedure,
            cancellationToken: ct));

            var header = await grid.ReadSingleOrDefaultAsync<StatementHeaderRow>();
            if (header is null) return null;

            if (header == null)
            {
                objresponse.Status = "Error";
                objresponse.Message ="No account statement details were found.";
                objresponse.Data = null;
                return objresponse;
            }

            // Read Statement Lines
            var lines = (await grid.ReadAsync<StatementLineRow>())
                .Select(l => new StatementLineDto(
                    Id: l.StatementLineId.ToString(),
                    ValueDate: l.ValueDate,
                    Narration: l.Narration,
                    Reference: l.ReferenceNo,
                    Amount: l.Amount,
                    RunningBalance: l.RunningBalance,
                    MatchState: l.MatchState,
                    NetsuiteRef: l.NetSuiteTranRef))
                .ToList();

            // Combine Header + Lines into one DTO
            var statementResponse = new AccountStatementDto(
                AccountId: header.AccountPublicId,
                From: header.FromDate,
                To: header.ToDate,
                OpeningBalance: header.OpeningBalance ?? 0m,
                ClosingBalance: header.ClosingBalance ?? 0m,
                Lines: lines);

            // Encrypt complete AccountStatementDto
            var encryptedData = _authRepository.EncryptionObje<AccountStatementDto>(statementResponse,appConfig.EncryptionKey);
            var DecryptedData = _authRepository.DecryptObject<AccountStatementDto>(encryptedData, appConfig.EncryptionKey);
            if (string.IsNullOrWhiteSpace(encryptedData))
            {
                objresponse.Status = "Error";
                objresponse.Message ="Unable to encrypt account statement details.";
                objresponse.Data = null;
                return objresponse;
            }

            // Success response
            objresponse.Status = "Success";
            objresponse.Message ="Account statement details retrieved successfully.";
            objresponse.Data = encryptedData;
            return objresponse;

        }
        catch(Exception ex)
        {
            objresponse.Status = "Error";
            objresponse.Message = $"An error occurred while retrieving account statement details. {ex.Message}";
            objresponse.Data = null;

            return objresponse;
        }  
    }
    public async Task<CommonObjResponse> GetAlertsAsync(bool includeResolved, int? userId, CancellationToken ct)
    {
        var objresponse = new CommonObjResponse();
        try
        {
            // Get Encryption Configuration
            var appsettingConfig = await _commonService.GetAppSetting_ConfigDetails();
            var appConfig = appsettingConfig.Data as AppConfig_Model;
            if (appConfig == null || string.IsNullOrWhiteSpace(appConfig.EncryptionKey))
            {
                objresponse.Status = "Error";
                objresponse.Message ="Encryption key is missing in the application configuration.";
                objresponse.Data = null;
                return objresponse;
            }

            using var db = _factory.Create();
            var rows = await db.QueryAsync<AlertRow>(new CommandDefinition(
                "bank.usp_GetAlerts",
                new { IncludeResolved = includeResolved, UserId = userId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));

            // Map AlertRow to AlertDto
            var alerts = rows
                .Select(r => new AlertDto(
                    Id: r.AlertPublicId,
                    Kind: r.Kind,
                    Headline: r.Headline,
                    Detail: r.Detail,
                    Meta: r.Meta,
                    AccountId: r.AccountPublicId,
                    RaisedAt: r.RaisedAt,
                    Acknowledged: r.Acknowledged))
                .ToList();

            // Check whether alerts were found
            if (alerts.Count == 0)
            {
                objresponse.Status = "Error";
                objresponse.Message = "No alert details were found.";
                objresponse.Data = null;
                return objresponse;
            }

            // Encrypt complete alert list
            var encryptedData =_authRepository.EncryptionObje<List<AlertDto>>(alerts,appConfig.EncryptionKey);
            var userDeEncryptedDetails = _authRepository.DecryptObject<List<AlertDto>>(encryptedData, appConfig.EncryptionKey);
            if (string.IsNullOrWhiteSpace(encryptedData))
            {
                objresponse.Status = "Error";
                objresponse.Message ="Unable to encrypt alert details.";
                objresponse.Data = null;
                return objresponse;
            }

            // Success Response
            objresponse.Status = "Success";
            objresponse.Message ="Alert details retrieved successfully.";
            objresponse.Data = encryptedData;
            return objresponse;
        }
        catch (Exception)
        {
            objresponse.Status = "Error";
            objresponse.Message ="An error occurred while retrieving alert details.";
            objresponse.Data = null;
            return objresponse;
        }

       
    }
    public async Task<CommonObjResponse> AcknowledgeAlertAsync(Guid alertId, string acknowledgedBy, CancellationToken ct)
    {
        var objresponse = new CommonObjResponse();
        try
        {
            var appsettingConfig = await _commonService.GetAppSetting_ConfigDetails();
            var appConfig = appsettingConfig.Data as AppConfig_Model;
            if (appConfig == null || string.IsNullOrWhiteSpace(appConfig.EncryptionKey))
            {
                objresponse.Status = "Error";
                objresponse.Message = "Encryption key is missing in the application configuration.";
                objresponse.Data = null;
                return objresponse;
            }
            using var db = _factory.Create();
            var affected = await db.ExecuteScalarAsync<int>(
                new CommandDefinition(
                    "bank.usp_AcknowledgeAlert",
                    new
                    {
                        AlertPublicId = alertId,
                        AcknowledgedBy = acknowledgedBy
                    },
                    commandType: CommandType.StoredProcedure,
                    cancellationToken: ct));

            var encryptedData = _authRepository.EncryptionObje<int>(affected, appConfig.EncryptionKey);
            var userDeEncryptedDetails = _authRepository.DecryptObject<int>(encryptedData, appConfig.EncryptionKey);
            if (affected > 0)
            {
                objresponse.Status = "Success";
                objresponse.Message ="Alert acknowledged successfully.";
                objresponse.Data = true;
            }
            else
            {
                objresponse.Status = "Error";
                objresponse.Message ="The alert could not be acknowledged. The alert may not exist or may have already been acknowledged.";
                objresponse.Data = false;
            }
            return objresponse;

        }
        catch(Exception ex)
        {
            objresponse.Status = "Error";
            objresponse.Message =$"An error occurred while acknowledging the alert.{ex.Message}";
            objresponse.Data = null;
            return objresponse;
        }
    }
    public async Task<int> RegenerateAlertsAsync(CancellationToken ct)
    {
        using var db = _factory.Create();

        return await db.ExecuteScalarAsync<int>(new CommandDefinition(
            "bank.usp_RaiseReconciliationAlerts",
            commandType: CommandType.StoredProcedure,
            commandTimeout: 60,
            cancellationToken: ct));
    }
    /* ---- row shapes: mirror the procedure result sets exactly ---- */
    private sealed class BalanceRow
    {
        public Guid AccountPublicId { get; init; }
        public Guid EntityPublicId { get; init; }
        public string EntityName { get; init; } = "";
        public Guid? ProjectPublicId { get; init; }
        public string ProjectName { get; init; } = "";
        public string BankName { get; init; } = "";
        public string AccountNumberMasked { get; init; } = "";
        public string Purpose { get; init; } = "current";
        public string CurrencyCode { get; init; } = "INR";
        public decimal OverdraftLimit { get; init; }
        public decimal? BankBalance { get; init; }
        public DateTime? BankBalanceAsOf { get; init; }
        public string FeedSource { get; init; } = "aggregator";
        public decimal? StatementClosingBalance { get; init; }
        public decimal? BookBalance { get; init; }
        public DateOnly? LastRecoDate { get; init; }
        public decimal? ChequesNotPresented { get; init; }
        public decimal? DepositsInTransit { get; init; }
        public decimal? ExpectedBook { get; init; }
        public decimal? UnexplainedBreak { get; init; }
        public decimal? UnclearedFunds { get; init; }
        public string RecoStatus { get; init; } = "nodata";
        public string FeedStatus { get; init; } = "manual";
        public int? FeedAgeMinutes { get; init; }
        public bool IsUnmapped { get; init; }
    }

    private sealed class SyncRow
    {
        public DateTime? AggregatorLastSyncAt { get; init; }
        public DateTime? NetSuiteLastSyncAt { get; init; }
        public DateTime? LastBalanceReceivedAt { get; init; }
    }
    private sealed class StatementHeaderRow
    {
        public Guid AccountPublicId { get; init; }
        public DateOnly FromDate { get; init; }
        public DateOnly ToDate { get; init; }
        public decimal? OpeningBalance { get; init; }
        public decimal? ClosingBalance { get; init; }
    }
    private sealed class StatementLineRow
    {
        public long StatementLineId { get; init; }
        public DateOnly ValueDate { get; init; }
        public string Narration { get; init; } = "";
        public string? ReferenceNo { get; init; }
        public decimal Amount { get; init; }
        public decimal? RunningBalance { get; init; }
        public string MatchState { get; init; } = "unmatched";
        public string? NetSuiteTranRef { get; init; }
    }
    private sealed class AlertRow
    {
        public Guid AlertPublicId { get; init; }
        public string Kind { get; init; } = "info";
        public string Headline { get; init; } = "";
        public string Detail { get; init; } = "";
        public string? Meta { get; init; }
        public DateTime RaisedAt { get; init; }
        public bool Acknowledged { get; init; }
        public Guid? AccountPublicId { get; init; }
    }
}

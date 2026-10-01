namespace Advantis.BankCockpit.Api.Contracts;

/// <summary>
/// Wire contracts. These mirror the TypeScript interfaces in
/// web/src/app/core/models/bank.models.ts one for one — if you change a
/// property here, change it there in the same commit.
///
/// System.Text.Json is configured for camelCase, so
/// <c>BankBalanceAsOf</c> serialises as <c>bankBalanceAsOf</c>.
/// </summary>
public sealed record BalancesResponse(
    DateTime? LastSyncAt,
    IReadOnlyList<BankAccountDto> Accounts);

public sealed record BankAccountDto(
    Guid Id,

    Guid EntityId,
    string EntityName,
    Guid? ProjectId,
    string ProjectName,

    string BankName,
    string AccountNumber,
    string Purpose,
    string CurrencyCode,
    decimal OverdraftLimit,

    // bank side — as supplied by the aggregator
    decimal BankBalance,
    DateTime? BankBalanceAsOf,
    string FeedSource,

    // book side — as supplied by NetSuite
    decimal StatementClosingBalance,
    decimal BookBalance,
    DateOnly? LastRecoDate,
    decimal ChequesNotPresented,
    decimal DepositsInTransit,

    // derived in bank.vw_AccountReconciliation — the browser never
    // recomputes these, so the screen, the alerts and any BI report
    // are guaranteed to agree
    decimal ExpectedBook,
    decimal UnexplainedBreak,
    decimal UnclearedFunds,
    string Status,
    string FeedStatus,
    int FeedAgeMinutes,
    bool IsUnmapped);

public sealed record StatementLineDto(
    string Id,
    DateOnly ValueDate,
    string Narration,
    string? Reference,
    decimal Amount,
    decimal? RunningBalance,
    string MatchState,
    string? NetsuiteRef);

public sealed record AccountStatementDto(
    Guid AccountId,
    DateOnly From,
    DateOnly To,
    decimal OpeningBalance,
    decimal ClosingBalance,
    IReadOnlyList<StatementLineDto> Lines);

public sealed record AlertDto(
    Guid Id,
    string Kind,
    string Headline,
    string Detail,
    string? Meta,
    Guid? AccountId,
    DateTime RaisedAt,
    bool Acknowledged);

using Advantis.BankCockpit.Api.Model;
using Dapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Identity.Client;
using System.Data;
using System.Data.Common;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading;

namespace Advantis.BankCockpit.Api.Data
{
    public interface ITransBnkService
    {
        Task<CommonObjResponse> GetAccountStatement([FromBody] jsonEncryptModel jsonEncrypt, int? userId, CancellationToken ct);   ////TransBnkRequest request   ,jsonEncryptModel jsonEncrypt
        Task<CommonObjResponse> GetTransBnkConfigAsync(int? session_userId, CancellationToken ct);
        TransBnkStatement_Model GetMappingTransBnkRequest_IntoBnkStatement(TransBnkRequest transBnk);    
        TransBnkStatement_Model GetMappingTransactionResponse_IntoBnkStatement(TransBnkTransactionResponse response);
        Task<CommonApiResponse<TResponse>> PostBnkStatementAsync<TResponse>(TransBnkRequest request, string? Apikey, string? BaseUrl);
        //TransBnkRequest SanitizeRequest(TransBnkRequest request);
        //string? CleanValue(string? value);
    }

    public class TransBnkService : ITransBnkService
    {
        private readonly IDbConnectionFactory _factory;
        private readonly HttpClient _httpClient;
        private readonly IAuthRepository _authRepository;
        private readonly ICommonService _commonService;

        public TransBnkService(IDbConnectionFactory factory, HttpClient httpClient, IAuthRepository authRepository,ICommonService commonService )
        {
            _factory = factory;
            _httpClient = httpClient;
            _authRepository = authRepository;
            _commonService = commonService;
        }
        public async Task<CommonObjResponse> GetAccountStatement([FromBody] jsonEncryptModel jsonEncrypt, int? userId , CancellationToken ct)  //TransBnkRequest request   ,jsonEncryptModel jsonEncrypt
        {
            var objresponse = new CommonObjResponse();
            int? sessionUserId = 0;
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
                    objresponse.Message = "EncryptionKey is missing in App_configPr.";
                    return (objresponse);
                }

                try
                {
                    //var loginecrypt = _authRepository.EncryptionObje<TransBnkRequest>(request, appConfig.EncryptionKey);
                    var request = _authRepository.DecryptObject<TransBnkRequest>(jsonEncrypt.jsonEncrypt, appConfig.EncryptionKey);
                    //var userModel = _authRepository.DecryptObject<TransBnkRequest>(loginecrypt, appConfig.EncryptionKey);
                    if (string.IsNullOrEmpty(request.CustomerId))
                    {
                        objresponse.Status = "Error";
                        objresponse.Message = "CustomerId Is Mandatory";
                        objresponse.Data = null;
                    }

                    if (request.CustomerId == "string" || request.BankCode == "string")
                    {
                        objresponse.Status = "Error";
                        objresponse.Message = "CustomerId & BankCode Not Be String";
                        objresponse.Data = null;
                    }

                    var configResponse = await GetTransBnkConfigAsync(sessionUserId, ct);
                    if (configResponse.Status != "Success" || configResponse.Data == null)
                    {
                        objresponse.Status = "Error";
                        objresponse.Message = "TransBnk Config Not Found";
                        objresponse.Data = null;
                        return (objresponse);
                    }
                    else
                    {
                        var configList = configResponse.Data as List<TransBnkConfigModel>;
                        var config = configList?.FirstOrDefault();
                        string? apiKey = config?.Api_Key;
                        string? baseUrl = config?.BaseUrl;
                        var bnkstatementModel = GetMappingTransBnkRequest_IntoBnkStatement(request);
                        var insrtReponse = await InsertUpdateTransBnkStatement(bnkstatementModel, ct);
                        if (insrtReponse.Status != "Success")
                        {
                            objresponse.Status = "Error";
                            objresponse.Message = "Error While Inserting TransBnk Statement";
                            objresponse.Data = null;
                            return (objresponse);
                        }
                        var response = await PostBnkStatementAsync<TransBnkTransactionResponse>(request, apiKey, baseUrl);
                        var AccStsEncryption = response.data != null ? _authRepository.EncryptionObje<TransBnkTransactionResponse>(response.data, appConfig.EncryptionKey) : string.Empty;
                        var AccStsDeEncryption = _authRepository.DecryptObject<TransBnkTransactionResponse>(AccStsEncryption, appConfig.EncryptionKey);
                        if (response.status!.Contains("Success"))
                        {

                            var mappingResponse = GetMappingTransactionResponse_IntoBnkStatement(response.data!);
                            var updateResponse = await InsertUpdateTransBnkStatement(mappingResponse, ct);
                            if (updateResponse.Status != "Success")
                            {
                                objresponse.Status = "Error";
                                objresponse.Message = "Error While Inserting TransBnk Transaction Response";
                                objresponse.Data = null;
                                return (objresponse);
                            }


                            
                            objresponse.Status = "Success";
                            objresponse.Message = "TransBnk Transaction Fetched Successfully";
                            objresponse.Data = AccStsEncryption;    //response;

                        }
                        else
                        {
                            objresponse.Status = "Error";
                            objresponse.Message = "Error While Fetching TransBnk Transaction";
                            objresponse.Data = AccStsEncryption;
                        }
                    }
                    return (objresponse);
                }
                catch (Exception ex)
                {
                    objresponse.Status = "Error";
                    objresponse.Message = $"Error Due to {ex.Message}";
                    objresponse.Data = null;
                    return (objresponse);
                }

            }
            catch(Exception ex)
            {
                objresponse.Status = "Error";
                objresponse.Message = $"Error Due to {ex.Message}";
                objresponse.Data = null;
                return (objresponse);
            }
            
           

        }

        public async Task<CommonObjResponse> GetTransBnkConfigAsync(int? session_userId, CancellationToken ct)
        {
            var commonResponse = new CommonObjResponse();
            try
            {
                using (var connection = _factory.Create())
                {
                    var parameters = new DynamicParameters();
                    parameters.Add("@Session_UserId", session_userId, DbType.Int32, ParameterDirection.Input);
                    var result = await connection.QueryAsync<TransBnkConfigModel>( new CommandDefinition("GetTransBnk_Config", commandType: CommandType.StoredProcedure, cancellationToken: ct , commandTimeout: 120));
                    int mkey = result.Select(x => x.Mkey).FirstOrDefault();
                    if (result == null || mkey > 0)
                    {
                        commonResponse.Status = "Success";
                        commonResponse.Message = "TransBnk Config fetched successfully.";
                        commonResponse.Data = result;
                    }
                    else
                    {
                        commonResponse.Status = "Failed";
                        commonResponse.Message = "No TransBnk Config found.";
                        commonResponse.Data = null;
                    }
                }
            }
            catch (Exception ex)
            {
                commonResponse.Status = "Failed";
                commonResponse.Message = $"Error fetching TransBnk Config: {ex.Message}";
                commonResponse.Data = null;
                throw;
            }
            return commonResponse;
        }

        public TransBnkStatement_Model GetMappingTransBnkRequest_IntoBnkStatement(TransBnkRequest transBnk)
        {

            var jsonContent = JsonSerializer.Serialize(transBnk);


            var model = new TransBnkStatement_Model
            {
                Mkey = 0,
                BankCode = transBnk.BankCode,
                EntityId = transBnk.EntityId,
                ProgramId = transBnk.ProgramId,
                CustomerId = transBnk.CustomerId,
                AccountNumber = transBnk.AccountNumber,
                FromDateTime = transBnk.FromDateTime,
                ToDateTime = transBnk.ToDateTime,
                JsonContent = jsonContent
            };

            return model;
        }

        public TransBnkStatement_Model GetMappingTransactionResponse_IntoBnkStatement(TransBnkTransactionResponse response)
        {
            var tresponse = new TransBnkStatement_Model
            {
                TransactionId = response.TransactionId,
                TransactionDate = response.TransactionDate,
                ValueDate = response.ValueDate,
                TransactionType = response.TransactionType,
                Remarks = response.Remarks,
                TransactionReferenceNumber = response.TransactionReferenceNumber,
                TransactionMode = response.TransactionMode,
                TransactionAmount = response.TransactionAmount,
                RunningBalance = response.RunningBalance,
                UtrNumber = response.UtrNumber,
                RemitterName = response.RemitterName,
                RemitterAccountNo = response.RemitterAccountNo,
                RemitterIfsc = response.RemitterIfsc,
                RemitterBankName = response.RemitterBankName,
                RemitterBranch = response.RemitterBranch,
                ResponseJsonContent = JsonSerializer.Serialize(response)
            };
            return tresponse;
        }

        public async Task<CommonObjResponse> InsertUpdateTransBnkStatement(TransBnkStatement_Model model ,CancellationToken ct)
        {
            var commonResponse = new CommonObjResponse();
            try
            {
                var parameters = new DynamicParameters();
                parameters.Add("@Mkey", model.Mkey ?? 0);
                parameters.Add("@BankCode", model.BankCode);
                parameters.Add("@EntityId", model.EntityId);
                parameters.Add("@ProgramId", model.ProgramId);
                parameters.Add("@CustomerId", model.CustomerId);
                parameters.Add("@AccountNumber", model.AccountNumber);
                parameters.Add("@FromDateTime", model.FromDateTime);
                parameters.Add("@ToDateTime", model.ToDateTime);
                parameters.Add("@TransactionId", model.TransactionId);
                parameters.Add("@TransactionDate", model.TransactionDate);
                parameters.Add("@ValueDate", model.ValueDate);
                parameters.Add("@TransactionType", model.TransactionType);
                parameters.Add("@Remarks", model.Remarks);
                parameters.Add("@TransactionReferenceNumber", model.TransactionReferenceNumber);
                parameters.Add("@TransactionMode", model.TransactionMode);
                parameters.Add("@TransactionAmount", model.TransactionAmount);
                parameters.Add("@RunningBalance", model.RunningBalance);
                parameters.Add("@UtrNumber", model.UtrNumber);
                parameters.Add("@RemitterName", model.RemitterName);
                parameters.Add("@RemitterAccountNo", model.RemitterAccountNo);
                parameters.Add("@RemitterIfsc", model.RemitterIfsc);
                parameters.Add("@RemitterBankName", model.RemitterBankName);
                parameters.Add("@RemitterBranch", model.RemitterBranch);
                parameters.Add("@JsonContent", model.JsonContent);
                parameters.Add("@ResponseJsonContent", model.ResponseJsonContent);
                parameters.Add("@Delete_Flag", string.IsNullOrWhiteSpace(model.Delete_Flag) ? "N" : model.Delete_Flag);
                parameters.Add("@Created_By", model.Created_By);
                parameters.Add("@CREATION_DATE", model.Creation_Date);
                parameters.Add("@LastUpdate_By", model.LastUpdate_By);
                parameters.Add("@LastUpdate_Date", model.LastUpdate_Date);
                // Output Parameters
                parameters.Add("@Out_Mkey", dbType: DbType.Int32, direction: ParameterDirection.Output);
                parameters.Add("@ResponseMessage", dbType: DbType.String, size: 500, direction: ParameterDirection.Output);
                using (var connection = _factory.Create())
                {
                    await connection.ExecuteAsync( new CommandDefinition("SP_Insert_Update_TransBnkStatement", parameters, commandType: CommandType.StoredProcedure , cancellationToken : ct , commandTimeout:120));
                }
                int? Mkey = parameters.Get<int>("@Out_Mkey");
                var ResponseMessage = parameters.Get<string>("@ResponseMessage");
                if (ResponseMessage != null || ResponseMessage!.Contains("Record Inserted Successfully") || ResponseMessage.Contains("Record Updated Successfully"))
                {
                    model.Mkey = Mkey;
                    commonResponse.Status = "Success";
                    commonResponse.Message = ResponseMessage;
                    commonResponse.Data = model;
                }
                else
                {
                    commonResponse.Status = "Failed";
                    commonResponse.Message = ResponseMessage;
                    commonResponse.Data = model;
                }
                return commonResponse;
            }
            catch (Exception ex)
            {

                commonResponse.Status = "Failed";
                commonResponse.Message = ex.Message;
                commonResponse.Data = model;
                return commonResponse;

            }
        }

        public async Task<CommonApiResponse<TResponse>> PostBnkStatementAsync<TResponse>(TransBnkRequest request, string? Apikey, string? BaseUrl)
        {
            var responseModel = new CommonApiResponse<TResponse>();
            try
            {
                var apiKey = Apikey;    //_configuration["TransBnk:ApiKey"];
                var baseUrl = BaseUrl;      //_configuration["TransBnk:BaseUrl"];
                var url = $"{baseUrl}/your-api-endpoint";
                if (string.IsNullOrWhiteSpace(apiKey))
                {
                    responseModel.status = "Failed";
                    responseModel.message = "TransBnk API Key is not configured.";
                    return responseModel;
                }
                var cleanRequest = SanitizeRequest(request);
                var json = JsonSerializer.Serialize(cleanRequest, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
                using var httpRequest = new HttpRequestMessage(HttpMethod.Post, url);
                // Required Headers
                httpRequest.Headers.Add("x-api-key", apiKey);
                httpRequest.Content = new StringContent(json, Encoding.UTF8, "application/json");

                // Call API
                using var response = await _httpClient.SendAsync(httpRequest);
                var responseContent = await response.Content.ReadAsStringAsync();
                if (response.IsSuccessStatusCode)
                {
                    var result = JsonSerializer.Deserialize<TResponse>(responseContent, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                    responseModel.status = "Success";
                    responseModel.message = "TransBnk API called successfully.";
                    responseModel.data = result;

                    return responseModel;
                }

                responseModel.status = "Failed";
                responseModel.message =
                    $"TransBnk API failed. Status Code: {(int)response.StatusCode}. Response: {responseContent}";

                return responseModel;
            }
            catch (HttpRequestException ex)
            {
                responseModel.status = "Failed";
                responseModel.message = $"HTTP request error: {ex.Message}";
                return responseModel;
            }
            catch (Exception ex)
            {
                responseModel.status = "Failed";
                responseModel.message = $"Unexpected error: {ex.Message}";
                return responseModel;
            }
        }

        private static TransBnkRequest SanitizeRequest(TransBnkRequest request)
        {
            return new TransBnkRequest
            {
                BankCode = CleanValue(request.BankCode),
                EntityId = CleanValue(request.EntityId),
                ProgramId = CleanValue(request.ProgramId),
                CustomerId = CleanValue(request.CustomerId),
                AccountNumber = CleanValue(request.AccountNumber),
                FromDateTime = CleanValue(request.FromDateTime),
                ToDateTime = CleanValue(request.ToDateTime),
                //CustomerRequestId = CleanValue(request.CustomerRequestId)
            };
        }
        private static string? CleanValue(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
                return value;
            // Replace special characters with space
            return System.Text.RegularExpressions.Regex.Replace(value, @"[^a-zA-Z0-9\s:/._-]", " ");
        }

    }
}

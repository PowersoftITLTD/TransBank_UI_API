using Advantis.BankCockpit.Api.Model;
using Dapper;
using Microsoft.AspNetCore.Components.Forms;
using Microsoft.Extensions.Configuration;
using System.Data;
using System.Data.Common;
using System.Net.Http;

namespace Advantis.BankCockpit.Api.Data
{

    public interface ICommonService
    {
        Task<CommonAppConfig<AppConfig_Model>> GetAppSetting_ConfigDetails();
    }
    public class CommonService : ICommonService
    {
        private readonly IDbConnectionFactory _factory;
        private readonly HttpClient _httpClient; 
        private readonly IConfiguration _configuration;

        public CommonService(IDbConnectionFactory factory, HttpClient httpClient, IConfiguration configuration)
        {
            _factory = factory;
            _httpClient = httpClient;
            _configuration = configuration;
            //_context = context;
        }

        public async Task<CommonAppConfig<AppConfig_Model>> GetAppSetting_ConfigDetails()
        {
            var commonresponse = new CommonAppConfig<AppConfig_Model>();
            try
            {
                using (var connection = _factory.Create())
                {
                    var result = await connection.QueryFirstOrDefaultAsync<AppConfig_Model>("[dbo].[SP_GET_App_Config_PR]",commandType: CommandType.StoredProcedure);
                    if (result == null)
                    {
                        commonresponse.Status = "Error";
                        commonresponse.Message ="No data returned from the stored procedure";
                        commonresponse.Data = null;
                    }
                    else
                    {
                        commonresponse.Status = "Success";
                        commonresponse.Message ="App_Config Details Fetch Successfully";
                        commonresponse.Data = result;
                    }
                    return commonresponse;
                }
            }
            catch (Exception ex)
            {
                commonresponse.Status = "Error";
                commonresponse.Message = $"Error Due To {ex.Message}";
                commonresponse.Data = null;
                return commonresponse;
            }
        }

    }
}

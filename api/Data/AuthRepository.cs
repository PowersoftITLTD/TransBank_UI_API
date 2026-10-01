using Advantis.BankCockpit.Api.Model;
using Dapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.Data;
using System.Data.Common;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace Advantis.BankCockpit.Api.Data
{

    public interface IAuthRepository
    {
        //Task<UserLoginModel?> GetUserByLoginNameAsync(string loginName, CancellationToken cancellationToken);
        //Task<bool> ValidateUserCredentialsAsync(string loginName, string password, CancellationToken cancellationToken);
        byte[] GetKey(string keyString, int requiredLength);
        string EncryptionObje<T>(T obj, string keyString);
        T DecryptObject<T>(string encryptedBase64, string keyString);
        Task<CommonAppConfig<string>> Authenticate(string username, string password, CancellationToken ct);
        byte[] UserEncryptedReponsone(UserModel userModel, string keyString);
        Task<CommonApiResponse<UserLoginModel>> GetUserDetailsWhenLoginIn(string? username, string password, CancellationToken ct);
        Task<CommonObjResponse> Login_PS([FromBody] jsonEncryptModel jsonEncrypt,  CancellationToken ct); //UserModel userModel   ,jsonEncryptModel jsonEncrypt
        Task<CommonObjResponse> LoginRegistration(jsonEncryptModel jsonEncrypt, CancellationToken ct);   ////UserLoginModel userLogin   ,jsonEncryptModel jsonEncrypt

    }

    public class AuthRepository : IAuthRepository
    {
        private readonly IDbConnectionFactory _factory;
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ICommonService _commonService;
        public AuthRepository(IDbConnectionFactory factory , HttpClient httpClient, IConfiguration configuration ,ICommonService commonService)
        {
            _factory = factory;
            _httpClient = httpClient;
            _configuration = configuration;
            _commonService = commonService;
            //_context = context;
        }


        public async Task<CommonObjResponse> Login_PS([FromBody] jsonEncryptModel jsonEncrypt, CancellationToken ct)   //UserModel userModel   ,jsonEncryptModel jsonEncrypt
        {
            var responseObject = new CommonObjResponse();
            //var loginecrypt = EncryptionObje<UserModel>(userModels, keyString);
            if (jsonEncrypt == null || string.IsNullOrEmpty(jsonEncrypt.jsonEncrypt))
            {
                responseObject.Status = "Error";
                responseObject.Message = "Invalid request. Please provide the required data.";
                return (responseObject);
            }
            var appsettingConfig = await _commonService.GetAppSetting_ConfigDetails();
            if (appsettingConfig.Data == null)
            {
                responseObject.Status = "Error";
                responseObject.Message = "App configuration not found";
                return (responseObject);
                //throw new Exception("App configuration not found.");
            }

            var appConfig = appsettingConfig.Data;
            if (string.IsNullOrWhiteSpace(appConfig.EncryptionKey))
            {
                responseObject.Status = "Error";
                responseObject.Message = "EncryptionKey is missing in App_configPr.";
                return (responseObject);
            }
            var userModel = DecryptObject<UserModel>(jsonEncrypt.jsonEncrypt,appConfig.EncryptionKey);
            //var userModel = DecryptObject<UserModel>(loginecrypt, keyString);
            try
            {
                if (userModel == null || string.IsNullOrEmpty(userModel.Username) || string.IsNullOrEmpty(userModel.Password))
                {
                    responseObject.Status = "Error";
                    responseObject.Message = "Please enter a valid username and password.";
                    return (responseObject);
                    //return Ok(new { message = "Please Entry Valide User & Password " });

                }
                var tokenData = await Authenticate(userModel.Username, userModel.Password ,ct);
                var token = tokenData.Data;               //await Authenticate(userModel.Username, userModel.Password ,ct);
                var UserEncrypted = UserEncryptedReponsone(userModel, appConfig.EncryptionKey);
                var UserDetails = await GetUserDetailsWhenLoginIn(userModel.Username, userModel.Password, ct );
                // Replace this line:
                //var userEncryptedDetails = EncryptionObje<UserLoginModel>(UserDetails.data, appConfig.EncryptionKey);

                // With this null-checked version:
                var userEncryptedDetails = UserDetails.data != null
                    ? EncryptionObje<UserLoginModel>(UserDetails.data, appConfig.EncryptionKey)
                    : string.Empty;
                var userDeEncryptedDetails = DecryptObject<UserLoginModel>(userEncryptedDetails, appConfig.EncryptionKey);
                if (token == null || token == "Invalid login name or password")
                {
                    responseObject.Status = "Error";
                    responseObject.Message = "Invalid username or password.";
                    return (responseObject);
                }
                if (UserEncrypted == null)
                {
                    responseObject.Status = "Error";
                    responseObject.Message = "Invalid user details.";
                    return (responseObject);
                }
                //var responseObject = new { status = "Ok", Message = "Token Generate Successfully", Token = token, UserEncryptedDetails = UserEncrypted };
                //return Ok(new { Token= token , UserEncryptedDetails = UserEncrypted  ,Status= "OK"});
                //return Ok(responseObject);
                responseObject.Status = "Ok";
                responseObject.Message = "Token generated successfully.";
                responseObject.Data = new { Token = token, UserEncryptedDetails = UserEncrypted, User = userEncryptedDetails };
                return (responseObject);
            }
            catch (Exception ex)
            {
                responseObject.Status = "Error";
                responseObject.Message = $"An error occurred: {ex.Message}";
                responseObject.Data = null;
                return (responseObject);

            }
        }

        public async Task<CommonObjResponse> LoginRegistration(jsonEncryptModel jsonEncrypt, CancellationToken c)   //UserLoginModel userLogin   ,jsonEncryptModel jsonEncrypt
        {
            //var keyString = _configuration["EncryptionKey"]; // Retrieve the key from the configuration
            var responseObject = new CommonObjResponse();

            var appsettingConfig = await _commonService.GetAppSetting_ConfigDetails();
            if (appsettingConfig.Data == null)
            {
                responseObject.Status = "Error";
                responseObject.Message = "App configuration not found";
                return (responseObject);
                //throw new Exception("App configuration not found.");
            }

            var appConfig = appsettingConfig.Data;
            if (string.IsNullOrWhiteSpace(appConfig.EncryptionKey))
            {
                responseObject.Status = "Error";
                responseObject.Message = "EncryptionKey is missing in App_configPr.";
                return (responseObject);
            }

            // var loginecrypt = EncryptionObje<UserLoginModel>(userLogin, appConfig.EncryptionKey);
            if (jsonEncrypt == null || string.IsNullOrEmpty(jsonEncrypt.jsonEncrypt))
            {
                responseObject.Status = "Error";
                responseObject.Message = "Invalid request. Please provide the required data.";
                return (responseObject);
            }
            var userLogin = DecryptObject<UserLoginModel>(jsonEncrypt.jsonEncrypt, appConfig.EncryptionKey);
            //var userModel = DecryptObject<UserLoginModel>(loginecrypt, appConfig.EncryptionKey);
            try
            {
                var parameters = new DynamicParameters();
                parameters.Add("@pLogin", userLogin.LoginName?.ToLower());
                parameters.Add("@pPassword", userLogin.PasswordHash); // Assuming this is already hashed or encrypted as needed
                parameters.Add("@pFirstName", userLogin.FirstName);
                parameters.Add("@pLastName", userLogin.LastName);
                parameters.Add("@responseMessage", dbType: DbType.String, direction: ParameterDirection.Output, size: 500);

                using (var _connection = _factory.Create())
                {
                    await _connection.ExecuteAsync("dbo.uspAddUser", parameters, commandType: CommandType.StoredProcedure);
                    string responseMessage = parameters.Get<string>("@responseMessage");
                    if (!string.IsNullOrEmpty(responseMessage))
                    {
                        responseObject.Status = "Success";
                        responseObject.Message = responseMessage;
                        return (responseObject);
                        
                    }
                    else
                    {
                        responseObject.Status = "Error";
                        responseObject.Message = $"User registration failed. {responseMessage}";
                        return (responseObject);
                    }
                }
            }
            catch (Exception ex)
            {

                responseObject.Status = "Error";
                responseObject.Message = $"Error Occure Due to.{ex.Message}";
                return (responseObject);
            }
        }



        //byte[] GetKey(string keyString, int requiredLength)     // Static
        //{
        //    if (keyString == null) keyString = string.Empty;
        //    byte[] key = Encoding.UTF8.GetBytes(keyString);

        //    if (key.Length == requiredLength)
        //        return key;

        //    var resized = new byte[requiredLength];
        //    Array.Copy(key, resized, Math.Min(key.Length, requiredLength));
        //    // If key is shorter: remaining bytes are zero (default)
        //    return resized;
        //}

        public string EncryptionObje<T>(T obj, string keyString)
        {
            string json = System.Text.Json.JsonSerializer.Serialize(obj);
            byte[] key = GetKey(keyString, 32);
            byte[] iv = new byte[16];

            using (Aes aes = Aes.Create())
            {
                aes.Key = key;
                aes.IV = iv;
                aes.Mode = CipherMode.CBC;
                aes.Padding = PaddingMode.PKCS7;

                ICryptoTransform encryptor = aes.CreateEncryptor(aes.Key, aes.IV);
                byte[] plainBytes = Encoding.UTF8.GetBytes(json);
                byte[] cipherBytes = encryptor.TransformFinalBlock(plainBytes, 0, plainBytes.Length);
                return Convert.ToBase64String(cipherBytes);
            }
        }
        public T DecryptObject<T>(string encryptedBase64, string keyString)
        {
            byte[] key = GetKey(keyString, 32);
            byte[] iv = new byte[16];

            using (Aes aes = Aes.Create())
            {
                aes.Key = key;
                aes.IV = iv;
                aes.Mode = CipherMode.CBC;
                aes.Padding = PaddingMode.PKCS7;

                ICryptoTransform decryptor = aes.CreateDecryptor(aes.Key, aes.IV);
                byte[] cipherBytes = Convert.FromBase64String(encryptedBase64);
                byte[] plainBytes = decryptor.TransformFinalBlock(cipherBytes, 0, cipherBytes.Length);

                string json = Encoding.UTF8.GetString(plainBytes);
                var result = System.Text.Json.JsonSerializer.Deserialize<T>(json);
                if (result is null)
                    throw new InvalidOperationException("Deserialization returned null.");
                return result;
            }
        }

        public byte[] GetKey(string keyString, int requiredLength)
        {
            if (keyString == null) keyString = string.Empty;
            byte[] key = Encoding.UTF8.GetBytes(keyString);

            if (key.Length == requiredLength)
                return key;

            var resized = new byte[requiredLength];
            Array.Copy(key, resized, Math.Min(key.Length, requiredLength));
            // If key is shorter: remaining bytes are zero (default)
            return resized;
        }

        public async Task<CommonAppConfig<string>> Authenticate(string username, string password , CancellationToken ct)
        {
            var responseObject = new CommonAppConfig<string>();
            var responseMessage = string.Empty;
            var userId = string.Empty;

            // Ensure both username and password are provided
            if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
            {
                responseObject.Status = "Error";
                responseObject.Message = "Please Enter Username and Password";
                responseObject.Data= null;
                return (responseObject);
            }

            var appsettingConfig = await _commonService.GetAppSetting_ConfigDetails();
            if (appsettingConfig.Data == null)
            {
                responseObject.Status = "Error";
                responseObject.Message = "App configuration not found";
                return (responseObject);
                //throw new Exception("App configuration not found.");
            }
            var appConfig = appsettingConfig.Data;
            var parameters = new DynamicParameters();
            parameters.Add("@pLoginName", username);
            parameters.Add("@pPassword", password);
            parameters.Add("@responseMessage", dbType: DbType.String, direction: ParameterDirection.Output, size: 250); // Output parameter
            parameters.Add("@UserId",dbType: DbType.String,direction: ParameterDirection.Output ,size : 100);

            try
            {
                using (var _connecttion = _factory.Create())
                {
                    await _connecttion.ExecuteAsync("[dbo].[uspLogin]", parameters, commandType: CommandType.StoredProcedure);
                }
                responseMessage = parameters.Get<string>("@responseMessage");
                userId =parameters.Get<string>("@UserId"); ;
                if (responseMessage == "User successfully logged in")
                {
                    // Generate the JWT token
                    var claims = new[]
                    {
                      new Claim(ClaimTypes.NameIdentifier,userId.ToString()),
                      new Claim(ClaimTypes.Name, username),  // The user's login name
                      new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()) // Unique identifier for the JWT
                     };
                    //var secretKey = _configuration["Jwt:SecretKey"] ?? string.Empty;
                    var secretKey = appConfig.SecretKey ?? string.Empty;               // _configuration["Jwt:SecretKey"] ?? string.Empty;
                    var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)); // Secret key from configuration
                    var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256); // Signing credentials

                    var token = new JwtSecurityToken(
                        //issuer: _configuration["Jwt:Issuer"],  // Issuer of the token
                        issuer: appConfig.Issuer ,         //_configuration["Jwt:Issuer"],  // Issuer of the token
                        //audience: _configuration["Jwt:Audience"], // Audience for the token
                        audience:  appConfig.Audience,                 //_configuration["Jwt:Audience"], // Audience for the token
                        claims: claims, // Claims associated with the token
                        expires: DateTime.Now.AddHours(1), // Token expiration time
                        signingCredentials: creds // Signing credentials
                    );

                    responseObject.Status = "Success";
                    responseObject.Status = "Token Generate Successfully";
                    responseObject.Data = new JwtSecurityTokenHandler().WriteToken(token);
                    // Return the JWT token
                    return responseObject;
                }
                else
                {
                    responseObject.Status = "Error";
                    responseObject.Message = "Invalid login name or password";
                    return (responseObject);
                }
            }
            catch (Exception ex)
            {

                responseObject.Status = "Error";
                responseObject.Message = $"An error occurred :{ex.Message}";
                return (responseObject);
                // Return any errors that occurred during the process
            }
        }
        public byte[] UserEncryptedReponsone(UserModel userModel, string keyString)
        {
            try
            {
                string combined = userModel.Username + ":" + userModel.Password; // Combine username and password with a separator (e.g., colon)

                byte[] key = GetKey(keyString, 32); // AES-256 requires a 32-byte key

                using (Aes aesAlg = Aes.Create())
                {
                    aesAlg.Key = key;
                    aesAlg.IV = new byte[16]; // Zeroed IV (not recommended for production)

                    ICryptoTransform encryptor = aesAlg.CreateEncryptor(aesAlg.Key, aesAlg.IV);

                    using (MemoryStream msEncrypt = new MemoryStream())
                    {
                        using (CryptoStream csEncrypt = new CryptoStream(msEncrypt, encryptor, CryptoStreamMode.Write))
                        {
                            using (StreamWriter swEncrypt = new StreamWriter(csEncrypt))
                            {
                                swEncrypt.Write(combined); // Write combined username and password to be encrypted
                            }
                        }
                        return msEncrypt.ToArray(); // Return the encrypted data as byte array
                    }
                }

            }
            catch (Exception)
            {
                throw;
            }
        }
        public async Task<CommonApiResponse<UserLoginModel>> GetUserDetailsWhenLoginIn(string? username, string password , CancellationToken ct)
        {
            var responseMessage = string.Empty;
            var commonApiResponse = new CommonApiResponse<UserLoginModel>();

            // Ensure both username and password are provided
            if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
            {
                commonApiResponse.message = "Please Enter Username and Password";
                commonApiResponse.status = "Error";
                commonApiResponse.data = null;
                return commonApiResponse;
            }

            var parameters = new DynamicParameters();
            parameters.Add("@pLoginName", username);
            parameters.Add("@pPassword", password);
            try
            {
                using (var connection = _factory.Create())
                {

                    var userDetails = await connection.QueryFirstOrDefaultAsync<UserLoginModel>("[dbo].[uspLoginDetail]", parameters, commandType: CommandType.StoredProcedure ,commandTimeout : 120);
                    if (userDetails != null && userDetails.UserId > 0)
                    {
                        commonApiResponse.status = "Ok";
                        commonApiResponse.message = "User Details Fetched Successfully";
                        commonApiResponse.data = userDetails;
                        return commonApiResponse;
                    }
                    else
                    {
                        commonApiResponse.message = "Invalid login name or password";
                        commonApiResponse.status = "Error";
                        commonApiResponse.data = null;
                        return commonApiResponse;
                    }
                }
            }
            catch (Exception ex)
            {
                commonApiResponse.message = $"Exception Error + {ex.Message}";
                commonApiResponse.status = "Error";
                commonApiResponse.data = null;
                return commonApiResponse;
            }
        }

        //public async Task<UserLoginModel?> GetUserByLoginNameAsync(string loginName, CancellationToken cancellationToken)
        //{
        //    return await _context.UserLogins
        //        .FirstOrDefaultAsync(u => u.LoginName == loginName, cancellationToken);
        //}
        //public async Task<bool> ValidateUserCredentialsAsync(string loginName, string password, CancellationToken cancellationToken)
        //{
        //    var user = await GetUserByLoginNameAsync(loginName, cancellationToken);
        //    if (user == null)
        //    {
        //        return false;
        //    }
        //    // Here you would typically hash the provided password and compare it to the stored hash.
        //    // For simplicity, we are doing a plain text comparison (not recommended for production).
        //    return user.PasswordHash == password; // Replace with proper hashing in production
        //}
    }
}

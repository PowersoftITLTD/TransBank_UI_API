using System.Text.Json.Serialization;

namespace Advantis.BankCockpit.Api.Model
{
    public class UserModel
    {
        public string? Username { get; set; }
        public string? Password { get; set; }
    }

    public class UserLoginModel
    {
        public int UserId { get; set; }

        public string? LoginName { get; set; }

        public string? PasswordHash { get; set; }

        public string? FirstName { get; set; }

        public string? LastName { get; set; }


        //public bool IsActive { get; set; }

        //public DateTime CreatedDate { get; set; }

        //public string? ModifiedBy { get; set; }

        //public DateTime? ModifiedDate { get; set; }  
    }

    public class jsonEncryptModel
    {
        public string? jsonEncrypt { get; set; }
    }

    public class CommonServicesModel<T>
    {
        public string? Status { get; set; }
        public string? Message { get; set; }
        public T? Data { get; set; }
    }


    public class AccStatement
    {
        [JsonPropertyName("accountId")]
        public string? AccountId { get; set; }


        [JsonPropertyName("from")]
        public string? From { get; set; }

        [JsonPropertyName("to")]
        public string? To { get; set; }
    } 
}

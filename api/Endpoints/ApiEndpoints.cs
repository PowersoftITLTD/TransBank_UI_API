using Advantis.BankCockpit.Api.Contracts;
using Advantis.BankCockpit.Api.Data;
using Advantis.BankCockpit.Api.Model;
using Azure;
using System.Security.Claims;

namespace Advantis.BankCockpit.Api.Endpoints;

public static class ApiEndpoints
{
    public static IEndpointRouteBuilder MapBankCockpit(this IEndpointRouteBuilder app)
     {
        var group = app.MapGroup("/api/v1").WithTags("Bank cockpit").RequireAuthorization();
        var Accgourp = app.MapGroup("/api/v1").WithTags("Auth");
        group.MapGet("/balances", async (
            IBankCockpitRepository repo, HttpContext http, CancellationToken ct) =>
        {
            Console.WriteLine("Endpoint hit!"); // Add this
            var (usersId, userName) = CurrentUser(http);
            if (usersId is not int uid)
            {
                return Results.Unauthorized();
            }
            var result = await repo.GetBalancesAsync(uid, ct);
            return Results.Ok(result);
        })
        .WithName("GetBalances");
        // .WithSummary("Every account with its bank position, book position and reconciliation status.");

        group.MapPost("/accountsStatement", async (
            jsonEncryptModel request ,
            IBankCockpitRepository repo,
            HttpContext http,
            CancellationToken ct) =>
        {
            var (usersId, userName) = CurrentUser(http);
            if (usersId is not int uid)
            {
                return Results.Unauthorized();
            }
            var statement = await repo.GetStatementAsync(request, uid, ct);
            return statement is null ? Results.NotFound() : Results.Ok(statement);
        })
        .WithName("GetStatement");
        //.WithSummary("Statement lines for one account, newest first.");

        group.MapGet("/alerts", async (
            bool? includeResolved,
            IBankCockpitRepository repo,
            HttpContext http,
            CancellationToken ct) =>
        {
            var (usersId, userName) = CurrentUser(http);
            if (usersId is not int uid)
            {
                return Results.Unauthorized();
            }


            Console.WriteLine("Endpoint hit!"); // Add this
            var alerts = await repo.GetAlertsAsync(includeResolved ?? false, uid, ct);
            return Results.Ok(alerts);
        })
        .WithName("GetAlerts");

        group.MapPatch("/alerts/{alertId:guid}/acknowledge", async (
            Guid alertId,
            IBankCockpitRepository repo,
            HttpContext http,
            CancellationToken ct) =>
        {

            var (usersId, userName) = CurrentUser(http);
            if (usersId is not int uid)
            {
                return Results.Unauthorized();
            }

            var by = uid.ToString();  // CurrentUserName(http);
            var response = await repo.AcknowledgeAlertAsync(alertId, by, ct);
            //return ok ? Results.NoContent() : Results.NotFound();
            return Results.Ok(response);
        })
        .WithName("AcknowledgeAlert");

        /// The button in the header. It does NOT reach a bank — it asks the
        /// database for the newest figures the aggregator has delivered and
        /// re-evaluates the alert rules. Returning the same numbers is a
        /// legitimate outcome and the UI is built to say so.
        group.MapPost("/sync", async (
            IBankCockpitRepository repo, HttpContext http, CancellationToken ct) =>
        {
            var (usersId, userName) = CurrentUser(http);
            if (usersId is not int uid)
            {
                return Results.Unauthorized();
            }

            await repo.RegenerateAlertsAsync(ct);
            var result = await repo.GetBalancesAsync(uid, ct);
            return Results.Ok(result);
        })
        .WithName("Sync");
        //.WithSummary("Re-read the latest delivered positions and refresh alerts.");


        group.MapPost("/AccountStatement", async (
            jsonEncryptModel request,
            ITransBnkService repo,
            HttpContext http,
            CancellationToken ct) =>
        {

            //if (string.IsNullOrWhiteSpace(request.AccountNumber))
            if (string.IsNullOrWhiteSpace(request.jsonEncrypt))
                return Results.BadRequest("JsonEncryption is mandatory.");

            //var userId = CurrentUserId(http);
            //if (userId is null)
            //    return Results.Unauthorized();
            var (usersId, userName) = CurrentUser(http);
            if (usersId is not int uid)
            {
                return Results.Unauthorized();
            }



            var result = await repo.GetAccountStatement(request, uid, ct);
            return Results.Ok(result);
        }).WithName("AccountStatement");
        // .WithSummary("Fetches Account Statement using a TransBnkRequest payload.");

        Accgourp.MapPost("/Login_PS", async (
            jsonEncryptModel request,
            IAuthRepository repo,
            HttpContext http,
            CancellationToken ct) =>
        {

            if (string.IsNullOrWhiteSpace(request.jsonEncrypt))
            //if (string.IsNullOrWhiteSpace(request.Username))
                return Results.BadRequest("JsonEncryption is mandatory.");

            //var userId = CurrentUserId(http);
            //if (userId is null)
            //    return Results.Unauthorized();

            var result = await repo.Login_PS(request, ct);
            return Results.Ok(result);
        }).WithName("Login_PS");

        Accgourp.MapPost("/Login_Registration", async (
            jsonEncryptModel request,
            IAuthRepository repo,
            HttpContext http,
            CancellationToken ct) =>
        {

            if (string.IsNullOrWhiteSpace(request.jsonEncrypt))
            //if (string.IsNullOrWhiteSpace(request.LoginName))
                return Results.BadRequest("JsonEncryption is mandatory.");

            //var userId = CurrentUserId(http);
            //if (userId is null)
            //    return Results.Unauthorized();

            var result = await repo.LoginRegistration(request, ct);
            return Results.Ok(result);
        }).WithName("Login_Registration");

        return app;
    }

    /// <summary>
    /// Placeholder for whatever you bolt on — Entra ID, JWT, Windows auth.
    /// Returning null means "no row filtering", which is correct for a single
    /// trusted internal deployment and wrong the day you expose this outside
    /// Finance. Replace it before that day.
    /// </summary>
    private static int? CurrentUserId(HttpContext http) =>
        int.TryParse(http.Request.Headers["X-User-Id"].FirstOrDefault(), out var id) ? id : null;


    private static (int? UserId, string? UserName) CurrentUser(HttpContext http)
    {
        var userIdValue = http.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        int? userId = int.TryParse(userIdValue, out var id)
            ? id
            : null;

        var userName = http.User.FindFirst(ClaimTypes.Name)?.Value;

        return (userId, userName);
    }


    private static string CurrentUserName(HttpContext http) =>
        http.Request.Headers["X-User-Name"].FirstOrDefault()
        ?? http.User.Identity?.Name
        ?? "system";
}

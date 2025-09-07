Program.cs

using Microsoft.EntityFrameworkCore;
using Elsewedy_Capstone_System.Models;
using Elsewedy_Capstone_System.Services;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

// إضافة DbContext مع Connection String
builder.Services.AddDbContext<SchoolDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Register JWT Service
builder.Services.AddScoped<IJwtService, JwtService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

// إضافة الخدمات الأساسية
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.Preserve;
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();


var app = builder.Build();


    app.UseSwagger();
    app.UseSwaggerUI();


app.UseCors("AllowAll");
app.UseHttpsRedirection();
app.UseAuthentication(); // Add authentication middleware
app.UseAuthorization();
app.MapControllers();
app.Run();

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace CompComm {
  /// <summary>Class responsible for preparing the Kestrel server..</summary>
  public class Startup {
    /// <summary>Startup method for setting up the appsettings.json file.</summary>
    public Startup(IHostingEnvironment env) {
      var builder = new ConfigurationBuilder()
        .SetBasePath(env.ContentRootPath)
        .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
        .AddJsonFile($"appsettings.{env.EnvironmentName}.json", optional: true)
        .AddEnvironmentVariables();
      Configuration = builder.Build();
    }

    /// <summary>Configuration object for MVC.</summary>
    public IConfigurationRoot Configuration { get; }
    
    /// <summary>This method gets called by the runtime.
    /// Use this method to add services to the container.</summary>
    public void ConfigureServices(IServiceCollection services) {
      // Add framework services.            
      services.AddMvc();
      services.AddCors();
      services.AddSingleton<IConfiguration>(Configuration);
    }

    /// <summary>This method gets called by the runtime.
    /// Use this method to configure the HTTP request pipeline.</summary>
    public void Configure(IApplicationBuilder app, IHostingEnvironment env, ILoggerFactory loggerFactory) {
      //loggerFactory.AddConsole(Configuration.GetSection("Logging"));
      //loggerFactory.AddDebug();            

      app.UseCors(builder => {
        builder.AllowAnyHeader();
        builder.AllowAnyMethod();
        builder.AllowAnyOrigin();
      }).UseMvc();
    }
  }
}

using System;
using System.IO;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using System.Net;

namespace CompComm {
  public class Program {
    private const int DEFAULT_PORT = 1996;
    
    /// <summary>Startup method for launching the server.</summary>
    /// <param name="args">Additional arguments for running.<br/>
    /// <code>--port</code> = change listening port.</param>
    public static void Main(string[] args) {
      var config = new ConfigurationBuilder()
        .SetBasePath(Directory.GetCurrentDirectory())
        .AddJsonFile("hosting.json", optional: true)
        .Build();

      int idx = Array.IndexOf(args, "--port");
      int portNum = idx == -1 ? DEFAULT_PORT : int.Parse(args[idx + 1]);

      try {
        var host = new WebHostBuilder()
          .UseConfiguration(config)
          .UseKestrel(options =>
            options.Listen(IPAddress.Loopback, portNum))
          .UseStartup<Startup>()
          .Build();
        host.Run();
      } catch (Exception e) {
        Console.WriteLine(e.Message);
      }
    }
  }
}

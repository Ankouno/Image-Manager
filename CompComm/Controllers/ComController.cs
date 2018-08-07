using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Configuration;
using System;
using System.Threading.Tasks;

namespace CompComm.Controllers {
  [Route("[controller]")]
  
  class ComController : Controller {
    /// <summary>Base path to the image folder.</summary>
    private readonly string BASE_PHYSICAL_PATH;

    /// <summary>Read in configurations.</summary>
    /// <param name="config">The config file to use.</param>
    public ComController(IConfiguration config) {
      Console.WriteLine("Controller started.");
      BASE_PHYSICAL_PATH = config["BASE_PHYSICAL_PATH"];
    }

    /// <summary>Checks whether communication with the app is successful.</summary>
    /// <returns>True if available.</returns>
    [HttpGet]
    public IActionResult Test() {
      Console.WriteLine("Service has been successfully pinged.");
      return Ok();
    }
  }
}

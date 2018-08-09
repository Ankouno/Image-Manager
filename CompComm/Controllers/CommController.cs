﻿using System;
using System.IO;
using System.Linq;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json.Linq;
using CompComm.Models;
using IOFile = System.IO.File;

namespace CompComm.Controllers {
  [Route("")]

  public class CommController : Controller {
    /// <summary>Base directory where all images are written to. </summary>		
    private readonly string BASE_PHYSICAL_PATH;

    /// <summary>The artist/character database.</summary>
    private readonly JObject db;

    /// <summary>Set up a new controller.</summary>
    /// <param name="config">The config file to pull parameters from.</param>
    public CommController(IConfiguration config) {
      BASE_PHYSICAL_PATH = config["BASE_PHYSICAL_PATH"];
      if (db == null) {
        string dbPath = Path.Combine(BASE_PHYSICAL_PATH, "database.json");
        using (StreamReader r = new StreamReader(dbPath)) {
          db = JObject.Parse(r.ReadToEnd());
        }
      }
    }

    /// <summary>Test connection to the controller.</summary>
    /// <returns>An OK response if functioning correctly.</returns>
    [HttpGet]
    public IActionResult Test() {
      Console.WriteLine("Controller has been successfully pinged.");
      return Ok();
    }

    /// <summary>Download an image URI to a specified location.</summary>
    /// <param name="img">The image to download.</param>
    /// <returns>A message containing an error if applicable.</returns>
    /// <exception cref="IOException">If the file already exists.</exception>
    [HttpPost("download")]
    public string Download(Image img) {
      Console.WriteLine("Downloading image...");
      var base64Data = Regex.Match(img.Data, @"data:image/(?<type>.+?),(?<data>.+)").Groups["data"].Value;
      var binData = Convert.FromBase64String(base64Data);

      img.Folder = img.Folder ?? "";
      var path = Path.Combine(BASE_PHYSICAL_PATH, img.Folder);
      var filename = Path.Combine(path, img.Filename);
      if (!IOFile.Exists(filename)) {
        if (!Directory.Exists(path)) { Directory.CreateDirectory(path); }
        IOFile.WriteAllBytes(filename, binData);
        Console.WriteLine("Image saved to {0}.", filename);
        return "Downloaded!";
      } else {
        Console.WriteLine("The specified file already exists!");
        return "The file already exists!";
      }
    }

    /// <summary>Get all subfolders of a directory.</summary>
    /// <param name="folder">The path to the folder to search in.</param>
    /// <returns>An array of all the found folder paths.</returns>
    [HttpGet("getFolders")]
    public string[] GetFolders(string folder = "") {
      Console.WriteLine("Getting directories.");
      if (folder is null) { folder = ""; }
      folder = Path.Combine(BASE_PHYSICAL_PATH, folder);
      return Directory.GetDirectories(folder);
    }

    /// <summary>Find an artist by name.</summary>
    /// <param name="name">The name of the artist to find.</param>
    /// <returns>A JSON object representing the artist.</returns>
    [HttpGet("fetchArtist")]
    public JsonResult FetchArtist(string name) {
      Console.WriteLine("Fetching artist: {0}", name);
      foreach (Artist a in db["artists"].ToObject<List<Artist>>()) {
        if (a.Nicknames.Contains(name, StringComparer.OrdinalIgnoreCase)) {
          return Json(a);
        }
      }
      return Json(null);
    }

    /// <summary>Adds or updates an artist in the database.</summary>
    /// <param name="artist">The artist to add/update.</param>
    /// <param name="update">Flag for whether to update an existing artist (true)
    ///   or add a new one (false).</param>
    [HttpPost("updateArtist")]
    public bool UpdateArtist(Artist artist, bool update) {
      Console.WriteLine("Updating/adding artist.");
      JArray artists = (JArray)db["artists"];

      if (update) {
        // Find existing artist by searching for their name.
        JObject a = artists.Children<JObject>().FirstOrDefault(
          o => ((JArray)o["Nicknames"]).ToObject<string[]>().Intersect(artist.Nicknames, StringComparer.OrdinalIgnoreCase).Any()
        );

        if (a != null) {
          artists[artists.IndexOf(a)] = JToken.FromObject(artist);
          UpdateDatabase();
          Console.WriteLine("Updated artist {0}.", artist.Nicknames[0]);
          return true;
        }
      }

      // Not updating or wasn't found; add new one.
      artists.Add(JToken.FromObject(artist));
      UpdateDatabase();
      Console.WriteLine("Added new artist {0}.", artist.Nicknames[0]);
      return true;
    }



    private void UpdateDatabase() {
      string dbPath = Path.Combine(BASE_PHYSICAL_PATH, "database.json");
      using (StreamWriter w = new StreamWriter(dbPath, false, System.Text.Encoding.UTF8)) {
        w.Write(db.ToString());
      }
    }
  }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CompComm.Models {
  public class Artist {
    /// <summary>Possible names for this artist.</summary>
    public string[] Nicknames { get; set; } = { };

    /// <summary>Subdirectory (from base) to this artist.</summary>
    public string Folder { get; set; } = "";

    /// <summary>List of any Twitter accounts.</summary>
    public string[] Twitter { get; set; } = { };

    /// <summary>List of any FurAffinity accounts.</summary>
    public string[] FA { get; set; } = { };

    /// <summary>List of any Pixiv accounts.</summary>
    public string[] Pixiv { get; set; } = { };

    /// <summary>List of other art accounts.</summary>
    public string[] Other { get; set; } = { };
  }
}

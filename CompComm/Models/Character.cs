using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CompComm.Models {
  public class Character {
    /// <summary>Name of this character.</summary>
    public string Name { get; set; } = "";

    /// <summary>Subdirectory (from base) to this character.</summary>
    public string Folder { get; set; } = "";
  }
}

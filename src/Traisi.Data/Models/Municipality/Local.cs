using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using Traisi.Data.Models.ResponseTypes;
using Traisi.Data.Models.Surveys;
using Newtonsoft.Json;

namespace Traisi.Data.Models.Municipality
{

    /// <summary>
    /// 
    /// </summary>
    public class Local 
    {

        public Local()
        {
            
        }

        public int Id { get; set; }
        
        public string Name { get; set; }

    }
}
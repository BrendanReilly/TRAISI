using System.Collections.Generic;
using DAL.Models.ResponseTypes;
using Newtonsoft.Json.Linq;

namespace TRAISI.ViewModels.SurveyViewer {
	public class SurveyResponseViewModel {
		
		public Dictionary<string,object> ResponseValue{get;set;}
	}
}
using DAL.Models.Questions;
using DAL.Models.Surveys;

namespace DAL.Models.ResponseTypes {
    public class StringResponse : SurveyResponse {

        public string Value { get; set; }
    }
}
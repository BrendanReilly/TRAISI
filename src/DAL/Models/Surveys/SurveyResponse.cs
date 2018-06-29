using DAL.Models.Questions;
using DAL.Models.ResponseTypes;

namespace DAL.Models.Surveys
{
    public class SurveyResponse : ISurveyResponse
    {
        public int Id { get; set; }

        public QuestionPart QuestionPart { get; set; }




    }
}
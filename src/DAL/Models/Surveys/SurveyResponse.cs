using DAL.Models.Questions;
using DAL.Models.ResponseTypes;
using TRAISI.SDK.Library.ResponseTypes;
namespace DAL.Models.Surveys {
	public class SurveyResponse : AuditableEntity, ISurveyResponse, IResponseType {
		public int Id { get; set; }

		public QuestionPart QuestionPart { get; set; }

		public ResponseValue ResponseValue { get; set; }

		public int ResponseValueId { get; set; }
		
		public ApplicationUser Respondent { get; set; }
		
		
	}
}
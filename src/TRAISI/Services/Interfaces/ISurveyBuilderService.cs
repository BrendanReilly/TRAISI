using System.Collections.Generic;
using DAL.Models.Questions;
using DAL.Models.Surveys;

namespace TRAISI.Services.Interfaces
{
    public interface ISurveyBuilderService
    {

        SurveyView AddSurveyView(Survey survey, string viewName);

        void RemoveSurveyView(Survey survey, int id);

        void SetQuestionConfiguration(QuestionPart questionPart, string name, string value);

        void SetQuestionOption(QuestionPart questionPart, string name, string value, string language);

        void AddQuestionOption(QuestionPart questionPart, string name, string value, string language);

        void RemoveQuestionConfiguration(QuestionPart questionPart, string name);

        void RemoveQuestionOption(QuestionPart questionPart, string name, string language);

        QuestionPart AddQuestionPart(SurveyView view,QuestionPart part, int position);

        IEnumerable<QuestionConfiguration> GetQuestionConfigurations(QuestionPart questionPart);

        IEnumerable<QuestionOption> GetQuestionOptions(QuestionPart questionPart, string language);
    }
}
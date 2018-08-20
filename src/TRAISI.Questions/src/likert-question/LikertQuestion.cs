using System.Collections;
using System.Collections.Generic;
using TRAISI.SDK.Attributes;
using TRAISI.SDK.Enums;
using TRAISI.SDK.Interfaces;


namespace TRAISI.SDK.Questions
{
    [SurveyQuestion(QuestionResponseType.Integer)]
    public class LikertQuestion : ISurveyQuestion
    {
        public string TypeName => "Likert";

        public string Icon
        {
            get => "fa-ellipsis-h";
        }
        public QuestionIconType IconType { get => QuestionIconType.FONT; }

        [QuestionOption(QuestionOptionValueType.KeyValuePair,
        IsMultipleAllowed = true,
            Name = "Likert Options",
            Description = "The list of likert choices presented to the user.",
            SurveyBuilderValueType = QuestionOptionValueType.KeyValuePair)]
        public ICollection ResponseOptions;
    }

}

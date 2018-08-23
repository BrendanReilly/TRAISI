using System.Collections;
using System.Collections.Generic;
using TRAISI.SDK.Attributes;
using TRAISI.SDK.Enums;
using TRAISI.SDK.Interfaces;


namespace TRAISI.SDK.Questions
{
    [SurveyQuestion(QuestionResponseType.Integer)]
    public class NumberQuestion : ISurveyQuestion
    {
        public string TypeName => "Number";

        public string Icon
        {
            get => "fa-sort-numeric-asc";
        }
        public QuestionIconType IconType { get => QuestionIconType.FONT; }

        [QuestionConfiguration(QuestionConfigurationValueType.String,
        Name = "Number Format",
        Description = "Format of the number.",
        SurveyBuilderValueType = QuestionBuilderType.SingleSelect,
        DefaultValue = "Integer",
        Resource = "numberquestion-format")]
        public string Format = "Integer";

        [QuestionConfiguration(QuestionConfigurationValueType.Integer,
        Name = "Min",
        Description = "Minimum Number.",
        SurveyBuilderValueType = QuestionBuilderType.NumericText,
        DefaultValue = "0")]
        public int Min = 0;

        [QuestionConfiguration(QuestionConfigurationValueType.Integer,
        Name = "Max",
        Description = "Maximum Number.",
        SurveyBuilderValueType = QuestionBuilderType.NumericText,
        DefaultValue = "100")]
        public int Max = 100;
    }

}
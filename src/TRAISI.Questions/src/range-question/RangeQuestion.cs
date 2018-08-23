using System.Collections;
using System.Collections.Generic;
using TRAISI.SDK.Attributes;
using TRAISI.SDK.Enums;
using TRAISI.SDK.Interfaces;


namespace TRAISI.SDK.Questions
{
    [SurveyQuestion(QuestionResponseType.Integer)]
    public class RangeQuestion : ISurveyQuestion
    {
        public string TypeName => "Range";

        public string Icon
        {
            get => "fa-sliders";
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

        [QuestionConfiguration(QuestionConfigurationValueType.Integer,
        Name = "Increment",
        Description = "Range Increment.",
        SurveyBuilderValueType = QuestionBuilderType.NumericText,
        DefaultValue = "1")]
        public int Increment = 100;
    }

}
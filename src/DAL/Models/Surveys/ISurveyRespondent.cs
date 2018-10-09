using System.Collections.Generic;

namespace DAL.Models.Surveys
{
    public interface ISurveyRespondent
    {
        int Id { get; set; }

        string FirstName { get; set; }

        string LastName { get; set; }

        SurveyRespondentGroup SurveyRespondentGroup { get; set; }


    }
}
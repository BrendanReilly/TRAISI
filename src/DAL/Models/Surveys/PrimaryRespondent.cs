using System.Collections.Generic;

namespace DAL.Models.Surveys
{
    /// <summary>
    /// Primary Respondent type for surveys.
    /// </summary>
    public class PrimaryRespondent : SurveyRespondent
    {

        public Shortcode Shortcode { get; set; }

        public ApplicationUser User { get; set; }

        public PrimaryRespondent() {
            
         }
    }
}
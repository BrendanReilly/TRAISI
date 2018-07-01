// ====================================================
// More Templates: https://www.ebenmonney.com/templates
// Email: support@ebenmonney.com
// ====================================================

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DAL.Models;
using DAL.Models.Surveys;

namespace DAL.Repositories.Interfaces
{
	public interface IGroupCodeRepository : IRepository<GroupCode>
	{
		Task<IEnumerable<GroupCode>> GetGroupCodesForSurveyAsync(int surveyId, bool isTest, int pageIndex, int pageSize);
		Task<int> GetCountOfGroupCodesForSurveyAsync(int surveyId, bool isTest);
		bool IsUniqueGroupCodeForSurvey(int surveyId, string code);
        IEnumerable<string> GetUniqueCodes(int surveyId, IEnumerable<string> codesToCheck);

    }
}
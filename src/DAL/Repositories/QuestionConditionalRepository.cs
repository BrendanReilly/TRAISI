using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using DAL.Models;
using DAL.Models.Questions;
using DAL.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Linq;
namespace DAL.Repositories
{
    /// <summary>
    /// 
    /// </summary>
    public class QuestionConditionalRepository : Repository<QuestionConditional>, IQuestionConditionalRepository
    {
  
        public QuestionConditionalRepository(ApplicationDbContext context) : base(context)
        {

        }
        
        private ApplicationDbContext _appContext => (ApplicationDbContext)_context;

        public void DeleteSourceConditionals(int questionPartId, List<int> retainedConditionals)
        {
            _appContext.QuestionConditionals.RemoveRange(_appContext.QuestionConditionals.Where(c => c.SourceQuestionId == questionPartId && !retainedConditionals.Contains(c.Id)));
        }
        public void DeleteTargetConditionals(int questionPartId, List<int> retainedConditionals)
        {
            _appContext.QuestionConditionals.RemoveRange(_appContext.QuestionConditionals.Where(c => c.TargetQuestionId == questionPartId && !retainedConditionals.Contains(c.Id)));
        }

        public async Task<IEnumerable<QuestionConditional>> GetQuestionConditionalsAsync(int questionPartId)
        {
            return await _appContext.QuestionConditionals
                .Where(q => q.SourceQuestionId == questionPartId || q.TargetQuestionId == questionPartId)
                .ToListAsync();
        }
    }
}
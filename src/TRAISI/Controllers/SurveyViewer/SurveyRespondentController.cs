using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TRAISI.Data;
using TRAISI.Data.Models;
using TRAISI.Data.Models.ResponseTypes;
using TRAISI.Data.Models.Surveys;
using TRAISI.Data.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json.Linq;
using TRAISI.Authorization;
using TRAISI.Services.Interfaces;
using TRAISI.ViewModels.SurveyViewer;
using TRAISI.SDK.Enums;
using System.Collections;
using Microsoft.AspNetCore.Http;

namespace TRAISI.Controllers.SurveyViewer
{
    /// <summary>
    /// 
    /// </summary>
    [Authorize]
    [Authorize(Policy = Policies.RespondToSurveyPolicy)]
    [ApiController]
    [Route("api/[controller]/")]
    public class SurveyRespondentController : ControllerBase
    {
        private ISurveyResponseService _respondentService;

        private IRespondentGroupService _respondentGroupService;

        private UserManager<ApplicationUser> _userManager;

        private IUnitOfWork _unitOfWork;

        /// <summary>
        /// 
        /// </summary>
        /// <param name="respondentService"></param>
        /// <param name="respondentGroupService"></param>
        /// <param name="unitOfWork"></param>
        /// <param name="userManager"></param>
        public SurveyRespondentController(ISurveyResponseService respondentService,
            IRespondentGroupService respondentGroupService,
            IUnitOfWork unitOfWork,
            UserManager<ApplicationUser> userManager)
        {
            this._respondentService = respondentService;
            this._userManager = userManager;
            this._respondentGroupService = respondentGroupService;
            this._unitOfWork = unitOfWork;
        }



        [Produces(typeof(int))]
        [Authorize(Policy = Policies.RespondToSurveyPolicy)]
        [HttpGet]
        [Route("surveys/{surveyId}/respondents/primary", Name = "Get_Primary_Respondent_For_Survey")]
        public async Task<ActionResult<PrimaryRespondent>> GetSurveyPrimaryRespondent(int surveyId)
        {
            var survey = await this._unitOfWork.Surveys.GetAsync(surveyId);
            if (survey == null)
            {
                return new NotFoundResult();
            }
            else
            {
                var respondent = await this._unitOfWork.SurveyRespondents.GetPrimaryRespondentForSurveyAsync(survey);

                if (respondent == null)
                {
                    var user = await _userManager.FindByNameAsync(this.User.Identity.Name);
                    var newRespondent = await this._unitOfWork.SurveyRespondents.CreatePrimaryResponentForUserAsnyc(user);
                    newRespondent.Survey = survey;
                    this._unitOfWork.SaveChanges();
                    return new ObjectResult(AutoMapper.Mapper.Map<SurveyRespondentViewModel>(newRespondent));

                }
                else
                {
                    return new ObjectResult(AutoMapper.Mapper.Map<SurveyRespondentViewModel>(respondent));
                }
            }

        }




        /// <summary>
        /// Adds passed respondent to a survey group.
        /// </summary>
        /// <param name="respondent"></param>
        /// <returns></returns>
        [HttpPost]
        [ProducesResponseType(typeof(int), StatusCodes.Status201Created)]
        [Authorize(Policy = Policies.RespondToSurveyPolicy)]
        [Route("respondents/groups")]
        public async Task<IActionResult> AddSurveyGroupMember([FromBody] SurveyRespondentViewModel respondent)
        {
            var user = await _userManager.FindByNameAsync(this.User.Identity.Name);
            var model = AutoMapper.Mapper.Map<SubRespondent>(respondent);
            var group = await this._respondentGroupService.GetSurveyRespondentGroupForUser(user);
            this._respondentGroupService.AddRespondent(group, model);
            await this._unitOfWork.SaveChangesAsync();
            return new ObjectResult(model.Id);
        }

        /// <summary>
        /// Updates a respondent details from a particular group
        /// </summary>
        /// <param name="respondent"></param>
        /// <returns></returns>
        [HttpPut]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [Authorize(Policy = Policies.RespondToSurveyPolicy)]
        [Route("respondents/groups")]
        public async Task<IActionResult> UpdateSurveyGroupMember([FromBody] SurveyRespondentViewModel respondent)
        {

            var user = await _userManager.FindByNameAsync(this.User.Identity.Name);
            //var model = AutoMapper.Mapper.Map<SubRespondent>(respondent);
            //var group = await this._respondentGroupService.GetSurveyRespondentGroupForUser(user);
            var result = await this._respondentGroupService.UpdateRespondent(respondent, user);
            await this._unitOfWork.SaveChangesAsync();
            return new OkResult();
        }

        /// <summary>
        /// Removes the associated respondent from their belonging survey group.
        /// </summary>
        /// <param name="respondentId"></param>
        /// <returns></returns>
        [HttpDelete]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [Authorize(Policy = Policies.RespondToSurveyPolicy)]
        [Route("groups/respondents/{respondentId:" + AuthorizationFields.RESPONDENT + "}/groups", Name = "Remove_Respondent_From_Survey_Group")]
        public async Task<IActionResult> RemoveSurveyGroupMember(
            int respondentId)
        {

            var respondent = await this._unitOfWork.SurveyRespondents.GetAsync(respondentId);
            if (respondent == null)
            {
                return new BadRequestResult();
            }

            var user = await _userManager.FindByNameAsync(this.User.Identity.Name);
            var group = await this._respondentGroupService.GetSurveyRespondentGroupForUser(user);
            await this._respondentGroupService.RemoveRespondent(group, respondent);

            await this._unitOfWork.SaveChangesAsync();

            return new OkResult();
        }

        /// <summary>
        /// Lists survey respondents (including primary) that are part of the passed respondent's group.
        /// </summary>
        /// <param name="AuthorizationFields.RESPONDENT"></param>
        /// <returns></returns>
        [HttpGet]
        [ProducesResponseType(typeof(List<SurveyRespondentViewModel>), StatusCodes.Status200OK)]
        [Authorize(Policy = Policies.RespondToSurveyPolicy)]
        [Route("groups/respondents/{respondentId}", Name = "List_Survey_Group_Members")]
        public async Task<IActionResult> ListSurveyGroupMembers(int respondent)
        {
            var user = await _userManager.FindByNameAsync(this.User.Identity.Name);
            var group = await this._respondentGroupService.GetSurveyRespondentGroupForUser(user);
            var members = AutoMapper.Mapper.Map<List<SurveyRespondentViewModel>>(group.GroupMembers);
            return new OkObjectResult(members);
        }


    }
}
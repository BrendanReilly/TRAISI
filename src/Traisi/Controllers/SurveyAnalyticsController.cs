using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json.Linq;
using Traisi.Data;
using Traisi.Data.Core.Interfaces;
using Traisi.Data.Models.Municipality;
using Traisi.Data.Models.Questions;
using Traisi.Data.Models.ResponseTypes;
using Traisi.Data.Models.Surveys;
using Traisi.Helpers;
using Traisi.Sdk.Enums;
using Traisi.Sdk.Interfaces;
using Traisi.Sdk.Questions;
using Traisi.Sdk.Services;
using Traisi.ViewModels;
using Newtonsoft.Json;

namespace Traisi.Controllers
{
    //[Authorize(Authorization.Policies.AccessAdminPolicy)]
    [Route("api/[controller]")]
    public class SurveyAnalyticsController : Controller
    {
        private readonly IUnitOfWork _unitOfWork;

        private readonly IAuthorizationService _authorizationService;

        private readonly IAccountManager _accountManager;

        private readonly IFileDownloader _fileDownloader;

        private readonly IMapper _mapper;

        private IWebHostEnvironment _hostingEnvironment;

        private IQuestionTypeManager _questionTypeManager;

        public SurveyAnalyticsController(
            IUnitOfWork unitOfWork,
            IWebHostEnvironment hostingEnvironment,
            IFileDownloader fileDownloaderService,
            IAuthorizationService authorizationService,
            IAccountManager accountManager,
            IMapper mapper,
            IQuestionTypeManager questionTypeManager
        )
        {
            this._unitOfWork = unitOfWork;
            this._authorizationService = authorizationService;
            this._accountManager = accountManager;
            this._fileDownloader = fileDownloaderService;
            this._mapper = mapper;
            this._hostingEnvironment = hostingEnvironment;
            this._questionTypeManager = questionTypeManager;
        }

        [HttpGet("{surveyId}/{questionId}")]
        public async Task<IActionResult>
        ResponseStatistics(int surveyId, int questionId)
        {
            //Surveys
            var surveys =
                await this
                    ._unitOfWork
                    .Surveys
                    .GetSurveyForAnalyticsUse(surveyId, 0);

            //Survey Responses
            var surveyResponses =
                this
                    ._unitOfWork
                    .DbContext
                    .SurveyResponses
                    .AsQueryable()
                    .Include(r => r.ResponseValues)
                    .Include(r => r.Respondent)
                    .ThenInclude(srg => srg.SurveyRespondentGroup)
                    .Include(r => r.QuestionPart);

            //Survey Response Values
            var surveyResponseValues =
                this
                    ._unitOfWork
                    .DbContext
                    .SurveyResponseValues
                    .AsQueryable()
                    .Include(sr => sr.SurveyResponse)
                    .ThenInclude(qp => qp.QuestionPart)
                    .ThenInclude(qo => qo.QuestionOptions)
                    .ThenInclude(qol => qol.QuestionOptionLabels);

            //complete
            var completedResponse =
                surveyResponses
                    .Where(item =>
                        item.QuestionPart.Id == questionId &&
                        item.QuestionPart.SurveyId == surveyId);

            var surveyCompleted =
                completedResponse
                    .Where(item => item.Respondent.HomeAddress != null)
                    .GroupBy(item => item.Respondent.HomeAddress.City);

            var completedResult =
                await(from item in surveyCompleted
                select new { City = item.Key, surveyCompleted = item.Count() })
                    .ToListAsync();

            //incomplete
            var incompleteResponse =
                surveyResponses
                    .Where(item =>
                        item.QuestionPart.Id != questionId &&
                        item.QuestionPart.SurveyId == surveyId);

            var surveyIncompleted =
                incompleteResponse
                    .Where(item => item.Respondent.HomeAddress != null)
                    .GroupBy(item => item.Respondent.HomeAddress.City);

            var incompletedResult =
                await(from item in surveyIncompleted
                select
                new { City = item.Key, surveyIncompleted = item.Count() })
                    .ToListAsync();

            //Responses based on QuestionType
            var question =
                await this
                    ._unitOfWork
                    .DbContext
                    .QuestionParts
                    .FindAsync(questionId);

            //Radio select
            if (
                this
                    ._questionTypeManager
                    .QuestionTypeDefinitions[question.QuestionType]
                    .ResponseType ==
                QuestionResponseType.OptionSelect
            )
            {
                //QuestionType Responses
                var questTypeResponses =
                    (
                    await surveyResponseValues
                        .Where(item =>
                            item.SurveyResponse.QuestionPart.Id == questionId &&
                            item.SurveyResponse.QuestionPart.SurveyId ==
                            surveyId)
                        .ToListAsync()
                    )
                        .Select(p =>
                        {
                            if (
                                ((OptionSelectResponse) p).Code !=
                                QuestionContants.NOTA
                            )
                            {
                                return new {
                                    Label =
                                        p
                                            .SurveyResponse
                                            .QuestionPart
                                            .QuestionOptions
                                            .FirstOrDefault(x =>
                                                x.Code ==
                                                ((OptionSelectResponse) p).Code)
                                            .QuestionOptionLabels
                                            .FirstOrDefault(x =>
                                                x.Language == "en")
                                            .Value,
                                    Code = ((OptionSelectResponse) p).Code,
                                    Value = ((OptionSelectResponse) p).Value,
                                    Order =
                                        p
                                            .SurveyResponse
                                            .QuestionPart
                                            .QuestionOptions
                                            .FirstOrDefault(x =>
                                                x.Code ==
                                                ((OptionSelectResponse) p).Code)
                                            .Order
                                };
                            }
                            else
                            {
                                return new {
                                    Label = QuestionContants.NOTA,
                                    Code = QuestionContants.NOTA,
                                    Value = QuestionContants.NOTA,
                                    Order =
                                        p
                                            .SurveyResponse
                                            .QuestionPart
                                            .QuestionOptions
                                            .Count +
                                        1
                                };
                            }
                        })
                        .GroupBy(item =>
                            new { item.Code, item.Label, item.Order })
                        .OrderBy(x => x.Key.Order);

                //QuestionType results
                var questionTypeResults =
                    (
                    from item in questTypeResponses
                    select
                    new {
                        QuestionOption = item.Key.Code,
                        Count = item.Count(),
                        Label = item.Key.Label
                    }
                    ).ToList();

                //Final results
                var finalResults =
                    new {
                        totalComplete = completedResponse.Count(),
                        totalIncomplete = incompleteResponse.Count(),
                        completedResponses = completedResult,
                        incompletedResponses = incompletedResult.ToList(),
                        questionTypeResults = questionTypeResults
                    };
                return Ok(finalResults);
            } //Matrix question
            else if (
                this
                    ._questionTypeManager
                    .QuestionTypeDefinitions[question.QuestionType]
                    .ClassName ==
                typeof (MatrixQuestion).Name
            )
            {
                //Matrix question type responses
                var matrixResults =
                    new {
                        Label = question.Name,
                        Count = completedResponse.Count()
                    };
                var result = new { matrixResults = matrixResults };
                return Ok(result);
            } //Travel-diary
            else if (
                this
                    ._questionTypeManager
                    .QuestionTypeDefinitions[question.QuestionType]
                    .ResponseType ==
                QuestionResponseType.Timeline
            )
            {
                var travelDiaryResponses =
                    this
                        ._unitOfWork
                        .DbContext
                        .SurveyResponses
                        .Include(r => r.ResponseValues)
                        .Include(r => r.Respondent)
                        .Include(r => r.QuestionPart)
                        .Where(r =>
                            r.QuestionPart.QuestionType == "travel-diary")
                        .ToList()
                        .GroupBy(r => r.Respondent);
                var travelDiaryResults =
                    new {
                        Label = question.Name,
                        Count = travelDiaryResponses.Count()
                    };
                var result = new { travelDiaryResults = travelDiaryResults };
                return Ok(result);
            } //Transit-Routes
            else if (
                this
                    ._questionTypeManager
                    .QuestionTypeDefinitions[question.QuestionType]
                    .ClassName ==
                typeof (RouteSelectQuestion).Name
            )
            {
                //Transit-routes question type responses
                var transitRoutesResults =
                    new {
                        Label = question.Name,
                        Count = completedResponse.Count()
                    };
                var result =
                    new { transitRoutesResults = transitRoutesResults };
                return Ok(result);
            } //Location
            else if (
                this
                    ._questionTypeManager
                    .QuestionTypeDefinitions[question.QuestionType]
                    .ResponseType ==
                QuestionResponseType.Location
            )
            {
                //Location question type responses
                var locationResults =
                    new {
                        Label = question.Name,
                        Count = completedResponse.Count()
                    };
                var result = new { locationResults = locationResults };
                return Ok(result);
            } //Household members
            else if (
                this
                    ._questionTypeManager
                    .QuestionTypeDefinitions[question.QuestionType]
                    .ClassName ==
                typeof (HouseholdQuestion).Name
            )
            {
                //Household question type responses
                var householdResults =
                    new {
                        Label = question.Name,
                        Count = completedResponse.Count()
                    };
                var result = new { householdResults = householdResults };
                return Ok(result);
            }
            else
            {
                // default case count how many answers exist
                //final result
                var finalResults =
                    new {
                        totalComplete = completedResponse.Count(),
                        totalIncomplete = incompleteResponse.Count(),
                        completedResponses = completedResult,
                        incompletedResponses = incompletedResult
                    };
                return Ok(finalResults);
            }
        }

        [HttpGet("{surveyId}")]
        public IActionResult GetQuestionNameList(int surveyId)
        {
            var questionParts =
                this
                    ._unitOfWork
                    .QuestionParts
                    .GetAll()
                    .Where(item => item.SurveyId == surveyId)
                    .ToList();
            questionParts.RemoveAll(x => x.QuestionType == "heading");
            var result =
                from item in questionParts
                select
                new {
                    Id = item.Id,
                    Name = item.Name,
                    Type = item.QuestionType
                };
            return Ok(result);
        }

        //Adding Regions to Database
        [HttpGet("GetRegions")]
        public IActionResult AddRegions()
        {
            string[] regionArr = {"Barrie", "Brant", "Brantford", "CFB Borden", "City of Kawartha Lakes", "City of Peterborough", 
                                   "Dufferin", "Durham", "Guelph", "Halton", "Hamilton", "Niagara", "Orangeville", "Orillia",
                                   "Peel", "Peterborough County", "Simcoe", "Toronto", "Waterloo", "Wellington", "York"};
            var n = 1;
            foreach(string item in regionArr)
            { 
                var region = new Regional();
                region.Name = item; 
                region.Id = n;
                n++;
                _unitOfWork.DbContext.Regionals.Add(region);                
            }
            _unitOfWork.DbContext.SaveChanges();
            return Ok("Region added to database");
        } 

        //Adding Locals to Database
        [HttpGet("GetLocals")]
        public IActionResult AddLocals()
        {
            string[] localArr = {"Ajax", "Aurora", "Brampton", "Brock", "Burlington", "Caledon", "Clarington", 
                                  "Durham", "East Gwillimbury", "Georgina", "Halton", "Halton Hills", 
                                  "King", "Markham", "Milton", "Mississauga", "Newmarket", "Oakville", 
                                  "Oshawa", "Peel", "Pickering", "Richmond Hill", "Scugog", "Toronto", 
                                  "Uxbridge", "Vaughan", "Whitby", "Whitchurch-Stouffville", "York"};
            var n = 1;
            foreach(string item in localArr)
            { 
                var local = new Local();
                local.Name = item; 
                local.Id = n;
                n++;
                _unitOfWork.DbContext.Locals.Add(local);                
            }
            _unitOfWork.DbContext.SaveChanges();
            return Ok("Local added to database");
        } 

        //Adding Metropolitans to Database
        [HttpGet("GetMetropolitans")]
        public IActionResult AddMetropolitans()
        {
            string[] metropolitanArr = {"Greater Toronto Area", "Greater Toronto and Hamilton Area",
                                         "Greater Golden Horseshoe Area"};
            var n = 1;
            foreach(string item in metropolitanArr)
            { 
                var metropolitan = new Metropolitan();
                metropolitan.Name = item; 
                metropolitan.Id = n;
                n++;
                _unitOfWork.DbContext.Metropolitans.Add(metropolitan);                
            }
            _unitOfWork.DbContext.SaveChanges();
            return Ok("Metropolitan added to database");
        } 

        //Adding Metas to Database
        [HttpGet("GetMetas")]
        public IActionResult AddMetas()
        {
            string[] metaArr = {"Ontario"};          
            var n = 1;
            foreach(string item in metaArr)
            { 
                var meta = new Meta();
                meta.Name = item; 
                meta.Id = n;
                n++;
                _unitOfWork.DbContext.Metas.Add(meta);                
            }
            _unitOfWork.DbContext.SaveChanges();
            return Ok("Meta added to database");
        } 
    }
}
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
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Traisi.Data;
using Traisi.Data.Core.Interfaces;
using Traisi.Data.Models.Questions;
using Traisi.Data.Models.ResponseTypes;
using Traisi.Data.Models.Surveys;
using Traisi.Helpers;
using Traisi.Sdk.Enums;
using Traisi.Sdk.Interfaces;
using Traisi.Sdk.Questions;
using Traisi.Sdk.Services;
using Traisi.ViewModels;

namespace Traisi.Controllers
{
    //[Authorize(Authorization.Policies.AccessAdminPolicy)]
    [Route("api/[controller]")]
    public class TravelLoggerController : Controller
    {
        private readonly IUnitOfWork _unitOfWork;

        private readonly IAuthorizationService _authorizationService;

        private readonly IAccountManager _accountManager;

        private readonly IFileDownloader _fileDownloader;

        private readonly IMapper _mapper;

        private IWebHostEnvironment _hostingEnvironment;

        private IQuestionTypeManager _questionTypeManager;

        public TravelLoggerController(
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

        [HttpGet("GetTripSourceData/{userId}")]
        public IActionResult GetTripSourceData(string userId)
        {
            string webRootPath = _hostingEnvironment.WebRootPath;
            string csvFilePath =
                webRootPath + "\\Upload\\Temp\\Complete Diary Samples.csv";

            var csv = new List<string[]>();
            var lines = System.IO.File.ReadAllLines(csvFilePath);

            foreach (string line in lines) csv.Add(line.Split(','));

            var properties = lines[0].Split(',');
            var listObjResult = new List<Dictionary<string, string>>();

            for (int i = 1; i < lines.Length; i++)
            {
                var objResult = new Dictionary<string, string>();
                for (int j = 0; j < properties.Length; j++)
                objResult.Add(properties[j], csv[i][j]);
                listObjResult.Add (objResult);
            }
            string result =
                JsonConvert
                    .SerializeObject(listObjResult
                        .Where(item => item["user_id"] == userId));
            return Ok(result);
        }
    }
}

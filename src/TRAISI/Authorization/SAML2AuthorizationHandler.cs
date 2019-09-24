﻿using System;
using System.Threading.Tasks;
using AspNet.Security.OpenIdConnect.Primitives;
using AutoMapper;
using DAL;
using DAL.Core.Interfaces;
using DAL.Models;
using DAL.Models.Surveys;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using TRAISI.SDK.Attributes;
using TRAISI.SDK.Interfaces;
using TRAISI.ViewModels.Users;

namespace TRAISI.Authorization.Extensions {
	[SurveyAuthorizationHandler (Name = "SAML2")]
	[Route ("api/[controller]")]
	public class SAML2AuthorizationHandler : Controller, ITraisiIAuthorizationHandler {

		[ExtensionConfigurationAttribute (Name = "Sign On URL", Description = "URL of sign on location")]
		public string SignOnURL { get; set; }

		private readonly UserManager<TraisiUser> _userManager;

		private readonly AuthenticationService _authenticationService;

		private readonly IAccountManager _accountManager;

		private readonly IUnitOfWork _unitOfWork;

		private readonly IConfiguration _configuration;

		private readonly string DEFAULT_AUTHENTICATION_ATTRIBUTE = "REMOTE_USER";

		private string AuthenticationAttribute { get; set; }

		/// <summary>
		/// 
		/// </summary>
		/// <param name="userManager"></param>
		public SAML2AuthorizationHandler (UserManager<TraisiUser> userManager,
			AuthenticationService authenticationService,
			IAccountManager accountManager,
			IUnitOfWork unitofWork,
			IConfiguration configuration) {
			this._userManager = userManager;
			this._authenticationService = authenticationService;
			this._accountManager = accountManager;
			this._unitOfWork = unitofWork;
			this._configuration = configuration;

			this.Initialize ();
		}

		private void Initialize () {
			var authAttribute = _configuration.GetValue<string> ("SAML2Authentication:AuthenticationAttribute");
			if (authAttribute == null) {
				AuthenticationAttribute = DEFAULT_AUTHENTICATION_ATTRIBUTE;
			} else {
				AuthenticationAttribute = authAttribute;
			}
		}

		[HttpGet]
		[Route ("session/{surveyCode}")]
		public ActionResult Session (string surveyCode) {
			var headers = Request.HttpContext.Request.Headers;

			return new OkObjectResult (headers);
		}

		[HttpGet]
		[Route ("login/{surveyCode}")]
		public async Task<IActionResult> Login (string surveyCode) {

			var headers = Request.HttpContext.Request.Headers;
			var identifiers = headers[this.AuthenticationAttribute];
			string identifier = "";

			if (identifiers.Count == 0) {

				// return BadRequest ("Request attribute not found in request headers");
				identifier = Guid.NewGuid ().ToString ();
			}

			var survey = await this._unitOfWork.Surveys.GetSurveyByCodeAsync (surveyCode);
			if (survey == null) {
				return new NotFoundResult ();
			}
			Shortcode shortcode = await this._unitOfWork.Shortcodes.GetShortcodeForSurveyAsync (survey, identifier);
			if (shortcode == null) {

				shortcode = new Shortcode () {
					Survey = survey,
						Code = identifier,
						IsTest = false,
						CreatedDate = DateTime.UtcNow
				};

				await this._unitOfWork.Shortcodes.AddAsync (shortcode);
				await this._unitOfWork.SaveChangesAsync ();
			} else {

			}

			return Redirect ($"/survey/{surveyCode}/start/{shortcode.Code}");
		}

		[ApiExplorerSettings (IgnoreApi = true)]
		[NonAction]
		public bool ShouldAuthorize (HttpContext s) {
			throw new NotImplementedException ();
		}
	}

}
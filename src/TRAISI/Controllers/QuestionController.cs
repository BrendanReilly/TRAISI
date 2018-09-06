﻿using System;
using Microsoft.AspNetCore.Mvc;
using TRAISI.SDK;
using TRAISI.SDK.Interfaces;
using DAL;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;

namespace TRAISI.Controllers {
	[Route("api/[controller]")]
	public class QuestionController : Controller {
		private IQuestionTypeManager _questionTypeManager;

		/// <summary>
		/// Inject the QuestionTypeManager service
		/// </summary>
		/// <param name="questionTypeManager"></param>
		public QuestionController(IQuestionTypeManager questionTypeManager) {
			this._questionTypeManager = questionTypeManager;
		}

		/// <summary>
		/// Returns the bundled module.js client code for the requested
		/// question definition.
		/// </summary>
		/// <param name="questionType"></param>
		/// <returns></returns>
		[HttpGet("client-code/{questionType}")]
		public ActionResult ClientCode(string questionType) {
			try {
				var questionTypeDefinition =
					_questionTypeManager.QuestionTypeDefinitions.FirstOrDefault(q =>
						string.Equals(q.TypeName, questionType));


				if (questionTypeDefinition.CodeBundleName == null) {
					return File(QuestionTypeDefinition.ClientModules.Values.ToList()[0], "application/javascript");
				}

				return File(
					QuestionTypeDefinition.ClientModules[
						QuestionTypeDefinition.ClientModules.Keys
							.FirstOrDefault(k => k.EndsWith(questionTypeDefinition.CodeBundleName,
								StringComparison.InvariantCultureIgnoreCase))],
					"application/javascript");
			}
			catch {
				//return error if not found
				return new EmptyResult();
			}
		}


		[HttpGet("question-types")]
		[Produces(typeof(List<QuestionTypeDefinition>))]
		public IEnumerable<QuestionTypeDefinition> QuestionTypes() {
			var questionTypes = this._questionTypeManager.QuestionTypeDefinitions;
			return questionTypes;
		}
	}
}
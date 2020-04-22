﻿using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using OfficeOpenXml;
using OfficeOpenXml.Style;  
using System.Drawing; 
using TRAISI.Helpers;
using System.Data;
using System.Collections.Generic;
using TRAISI.Data.Models.Questions;

namespace TRAISI.Export
{
    class Program
    {

        public static int Main(string[] args)
        {
            // connect to the database
            var contextFactory = new DesignTimeDbContextFactory();
            var context = contextFactory.CreateDbContext(args);
            var questionTypeManager = new QuestionTypeManager(null, new NullLoggerFactory());
            questionTypeManager.LoadQuestionExtensions("../TRAISI/extensions");
            var questionExporter = new QuestionTableExporter(context, questionTypeManager);
            var responseTableExporter = new ResponseTableExporter(context, questionTypeManager);
            var responderTableExporter = new ResponderTableExporter(context);
            var personalIDs = new List<int> {1,13,14,15,17,18,21,22,23,24,26,27,28,29,30,31,32,33,34};
            var houseHoldIDs = new List<int> {25,16,12,9,8,11,10,6,3,5,4,7,19,2,20};

            if (args.Length < 1)
            {
                Console.Error.WriteLine("Please specify the survey code as an input argument.");
                return 1;
            }

            // Read survey name
            var survey = context.Surveys
            .AsQueryable()
            .Where(s => string.Equals(s.Code, args[0]))
            .Include(s => s.SurveyViews)
            .ThenInclude(v => v.QuestionPartViews)
            .FirstOrDefault();

            if (survey == null)
            {
                Console.Error.WriteLine($"Survey with code {args[0]} does not exist. Exiting.");
                return 1;
            }
           
            Console.WriteLine("Gathering Questions");
            var view = survey.SurveyViews.FirstOrDefault();
            if (view == null)
            {
                Console.Error.WriteLine($"Survey has no views or data. Exiting.");
                return 1;
            }

            /* var questionPartViews = view.QuestionPartViews.OrderBy(p => p.Order).ToList();
            var questionPartViewTasks =
                questionPartViews.Select(questionExporter.QuestionPartsList).ToList();
            Task.WhenAll(questionPartViewTasks).Wait();
            questionPartViews = questionPartViewTasks
                .SelectMany(nl => nl.Result)
                .ToList(); */

            List<QuestionPartView> questionPartViews = new List<QuestionPartView>();
           
            foreach (var page in view.QuestionPartViews)
            {
                context.Entry(page).Collection(c => c.QuestionPartViewChildren).Load();
                context.Entry(page).Reference(r => r.QuestionPart).Load();
                foreach (var q in page.QuestionPartViewChildren)
                {                     
                    context.Entry(q).Collection(c => c.Labels).Load();
                    context.Entry(q).Reference(r => r.QuestionPart).Load();
                    context.Entry(q).Collection(c => c.QuestionPartViewChildren).Load();

                    if (q.QuestionPart != null)
                    {
                        context.Entry(q.QuestionPart).Collection(c => c.QuestionOptions).Load();
                        foreach (var option in q.QuestionPart.QuestionOptions)
                        {
                            context.Entry(option).Collection(option => option.QuestionOptionLabels).Load();
                        }
                        questionPartViews.Add(q);
                    }

                    foreach (var q2 in q.QuestionPartViewChildren)
                    {   
                        context.Entry(q2).Collection(c => c.Labels).Load();
                        context.Entry(q2).Reference(r => r.QuestionPart).Load();
                        context.Entry(q2.QuestionPart).Collection(c => c.QuestionOptions).Load();
                        context.Entry(q2).Collection(c => c.QuestionPartViewChildren).Load();
                        foreach (var option in q2.QuestionPart.QuestionOptions)
                        {
                            context.Entry(option).Collection(option => option.QuestionOptionLabels).Load();
                        }
                        questionPartViews.Add(q2);
                    }
                }
                continue;
            }

            Console.WriteLine("Getting Responses");
            var responses = responseTableExporter.ResponseList(questionPartViews);
            Console.WriteLine("Finding Respondents");
            var respondents = responderTableExporter.GetSurveyRespondents(survey);
            var questionParts = questionPartViews.Select(qpv => qpv.QuestionPart).ToList();    

            // Separating Personal and Household questions    
            var questionPartViews_personal=questionPartViews.Where(qpv =>personalIDs.Contains(qpv.QuestionPart.Id)).ToList();
            var questionPartViews_houseHold=questionPartViews.Where(qpv =>houseHoldIDs.Contains(qpv.QuestionPart.Id)).ToList();

            var responses_personal=responses.Where(res =>personalIDs.Contains(res.QuestionPart.Id)).ToList();
            var responses_houseHold=responses.Where(res =>houseHoldIDs.Contains(res.QuestionPart.Id)).ToList();

            var questionParts_personal=questionParts.Where(qp => personalIDs.Contains(qp.Id)).ToList();
            var questionParts_houseHold=questionParts.Where(qp => houseHoldIDs.Contains(qp.Id)).ToList();
           
            // Household Questions Excel file
            var hfi = new FileInfo(@"..\..\src\TRAISI.Export\surveyexportfiles\HouseholdQuestions.xlsx");
            if (hfi.Exists)
            {
                hfi.Delete();
            }
            using (var eXp = new ExcelPackage(hfi))
            {                
                // initalize a sheet in the workbook
                var workbook = eXp.Workbook;
                Console.WriteLine("Writing Household Question sheet");
                var hhQuestionsSheet = workbook.Worksheets.Add("Household Questions");
                questionExporter.BuildQuestionTable(questionPartViews_houseHold, hhQuestionsSheet);
                Console.WriteLine("Writing Household Response Sheet");
                var hhResponseSheet = workbook.Worksheets.Add("Household Responses");
                responseTableExporter.ResponseListToWorksheet(responses_houseHold, hhResponseSheet, true);
                Console.WriteLine("Writing Household Response Pivot Sheet");
                var hhResponsePivotSheet = workbook.Worksheets.Add("Household Responses Pivot");
                responseTableExporter.ResponsesPivot_HouseHold(questionParts_houseHold, responses_houseHold, respondents, hhResponsePivotSheet);
                eXp.Save();
            }
            
            // Personal Questions Excel file
            var pfi = new FileInfo(@"..\..\src\TRAISI.Export\surveyexportfiles\PersonalQuestions.xlsx");
            if (pfi.Exists)
            {
                pfi.Delete();
            }
            using (var eXp = new ExcelPackage(pfi))
            {
                // initalize a sheet in the workbook
                var workbook = eXp.Workbook;
                Console.WriteLine("Writing Personal Question sheet");
                var pQuestionsSheet = workbook.Worksheets.Add("Personal Questions");
                questionExporter.BuildQuestionTable(questionPartViews_personal, pQuestionsSheet);
                Console.WriteLine("Writing Personal Response sheet");
                var pResponseSheet = workbook.Worksheets.Add("Personal Responses");
                responseTableExporter.ResponseListToWorksheet(responses_personal, pResponseSheet, false);
                Console.WriteLine("Writing Personal Responses Pivot sheet");
                var pResponsePivotSheet = workbook.Worksheets.Add("Personal Responses Pivot");
                responseTableExporter.ResponsesPivot_Personal(questionParts_personal, responses_personal, respondents, pResponsePivotSheet);
                eXp.Save();
            }
            return 0;
        }

    }
}
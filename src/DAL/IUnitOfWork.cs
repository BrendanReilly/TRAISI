﻿using DAL.Repositories.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DAL
{
    public interface IUnitOfWork
    {

        ISurveyRepository Surveys { get; }
        ISurveyPermissionsRepository SurveyPermissions { get; }
        IApiKeysRepository ApiKeys { get; }
        IEmailTemplateRepository EmailTemplates { get; }
				ISiteSurveyTemplateRepository SiteSurveyTemplates { get; }
        IShortcodeRepository Shortcodes { get; }
        IGroupCodeRepository GroupCodes { get; }
        IUserGroupRepository UserGroups { get; }
        IGroupMemberRepository GroupMembers { get; }
        ISurveyViewRepository SurveyViews { get; }
        IQuestionPartRepository QuestionParts { get; }
				IWelcomePageLabelRepository WelcomePageLabels { get; }
				IThankYouPageLabelRepository ThankYouPageLabels { get; }
				ITermsAndConditionsPageLabelRepository TermsAndConditionsPageLabels { get; }


        int SaveChanges();
        Task<int> SaveChangesAsync();

        void EnableAutoDetectChanges();

        void DisableAutoDetectChanges();
    }
}

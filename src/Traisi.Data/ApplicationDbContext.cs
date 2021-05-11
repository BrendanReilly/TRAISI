using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Traisi.Data.Models;
using Traisi.Data.Models.Groups;
using Traisi.Data.Models.Interfaces;
using Traisi.Data.Models.Questions;
using Traisi.Data.Models.ResponseTypes;
using Traisi.Data.Models.Surveys;
using Traisi.Data.Models.Municipality;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Traisi.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, string>
    {
        public ApplicationDbContext(string currentUserId)
        {
            this.CurrentUserId = currentUserId;

        }
        public string CurrentUserId { get; set; }

        public DbSet<Survey> Surveys { get; set; }
        public DbSet<SurveyPermission> SurveyPermissions { get; set; }
        public DbSet<UserGroup> UserGroups { get; set; }
        public DbSet<GroupMember> GroupMembers { get; set; }
        public DbSet<ApiKeys> ApiKeys { get; set; }
        public DbSet<EmailTemplate> EmailTemplates { get; set; }
        public DbSet<SiteSurveyTemplate> SiteSurveyTemplates { get; set; }
        public DbSet<Shortcode> Shortcodes { get; set; }
        public DbSet<Groupcode> Groupcodes { get; set; }
        public DbSet<QuestionPart> QuestionParts { get; set; }

        public DbSet<Local> Locals { get; set; }
        public DbSet<Meta> Metas { get; set; }
        public DbSet<Metropolitan> Metropolitans { get; set; }
        public DbSet<Regional> Regionals { get; set; }
        public DbSet<FSA> FSAs { get; set; }

        public DbSet<QuestionConditionalOperator> QuestionConditionalOperators { get; set; }

        public DbSet<QuestionConfiguration> QuestionConfigurations { get; set; }

        public DbSet<QuestionOption> QuestionOptions { get; set; }

        public DbSet<QuestionConditional> QuestionConditionals { get; set; }

        public DbSet<QuestionOptionConditional> QuestionOptionConditionals { get; set; }

        public DbSet<ResponseValue> SurveyResponseValues { get; set; }

        public DbSet<LocationResponse> OptionSelectResponses { get; set; }
        public DbSet<SurveyView> SurveyViews { get; set; }

        public DbSet<QuestionPartView> QuestionPartViews { get; set; }

        public DbSet<PrimaryRespondent> PrimaryRespondents { get; set; }

        public DbSet<SubRespondent> SubRespondents { get; set; }

        public DbSet<SurveyRespondent> SurveyRespondents { get; set; }

        public DbSet<SurveyResponse> SurveyResponses { get; set; }

        public DbSet<SurveyAccessRecord> SurveyAccessRecords { get; set; }

        public DbSet<SurveyUser> SurveyUsers { get; set; }

        public DbSet<TraisiUser> TraisiUsers { get; set; }

        public DbSet<Label> Labels { get; set; }

        public DbSet<ExtensionConfiguration> ExtensionConfigurations { get; set; }

        public DbSet<SurveyLogic> SurveyLogic { get; set; }

        public ApplicationDbContext(DbContextOptions options) : base(options) { }

        public ApplicationDbContext() { }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);
            builder.HasPostgresExtension("postgis");

            builder.Entity<ApplicationUser>().HasMany(u => u.Claims).WithOne().HasForeignKey(c => c.UserId).IsRequired().OnDelete(DeleteBehavior.Cascade);
            builder.Entity<ApplicationUser>().HasMany(u => u.Roles).WithOne().HasForeignKey(r => r.UserId).IsRequired().OnDelete(DeleteBehavior.Cascade);

            builder.Entity<ApplicationRole>().HasMany(r => r.Claims).WithOne().HasForeignKey(c => c.RoleId).IsRequired().OnDelete(DeleteBehavior.Cascade);
            builder.Entity<ApplicationRole>().HasMany(r => r.Users).WithOne().HasForeignKey(r => r.RoleId).IsRequired().OnDelete(DeleteBehavior.Cascade);
            builder.Entity<SurveyUser>().HasOne(su => su.Shortcode).WithMany().OnDelete(DeleteBehavior.Cascade);
            builder.Entity<SurveyAccessRecord>().HasOne(r => r.AccessUser).WithMany().OnDelete(DeleteBehavior.Cascade);

            builder.Entity<SurveyUser>().HasOne(r => r.PrimaryRespondent).WithMany().OnDelete(DeleteBehavior.Cascade);

            builder.Entity<ApplicationUser>().HasDiscriminator<int>("UserType")
                .HasValue<TraisiUser>(0)
                .HasValue<SurveyUser>(1);

            builder.Entity<SurveyUser>().HasOne(r => r.PrimaryRespondent);

            builder.Entity<SurveyUser>().Property(e => e.Id).ValueGeneratedOnAdd();

            builder.Entity<ExtensionConfiguration>().ToTable($"{nameof(this.ExtensionConfigurations)}");

            builder.Entity<Survey>().HasMany(s => s.ExtensionConfigurations).WithOne(s => s.Survey);
            builder.Entity<ExtensionConfiguration>().Property(s => s.Configuration).HasDefaultValue("{}");
            builder.Entity<Survey>().Property(s => s.Name).IsRequired().HasMaxLength(100);
            builder.Entity<Survey>().Property(s => s.Code).IsRequired().HasMaxLength(30);
            builder.Entity<Survey>().HasMany(s => s.SurveyViews).WithOne(k => k.Survey).OnDelete(DeleteBehavior.Cascade);
            builder.Entity<Survey>().HasMany(s => s.SurveyPermissions).WithOne(k => k.Survey).OnDelete(DeleteBehavior.Cascade);
            builder.Entity<Survey>().HasMany(s => s.GroupCodes).WithOne(k => k.Survey).OnDelete(DeleteBehavior.Cascade);
            builder.Entity<Survey>().HasMany(s => s.Shortcodes).WithOne(sc => sc.Survey).OnDelete(DeleteBehavior.Cascade);
            builder.Entity<Survey>().HasMany(s => s.TitleLabels).WithOne().HasForeignKey("SurveyId").OnDelete(DeleteBehavior.Cascade);
            builder.Entity<Survey>().ToTable($"{nameof(this.Surveys)}");

            builder.Entity<SurveyView>().Property(s => s.ViewName).IsRequired().HasMaxLength(100);
            builder.Entity<SurveyView>().HasMany(s => s.QuestionPartViews).WithOne(s => s.SurveyView).OnDelete(DeleteBehavior.Cascade);

            builder.Entity<Label>().ToTable($"{nameof(Labels)}");
            builder.Entity<SurveyView>().HasMany(s => s.WelcomePageLabels).WithOne().HasForeignKey("SurveyViewWelcomePageId").OnDelete(DeleteBehavior.Cascade);
            builder.Entity<SurveyView>().HasMany(s => s.TermsAndConditionsLabels).WithOne().HasForeignKey("SurveyViewTermsId").OnDelete(DeleteBehavior.Cascade);
            builder.Entity<SurveyView>().HasMany(s => s.ThankYouPageLabels).WithOne().HasForeignKey("SurveyViewThankYouId").OnDelete(DeleteBehavior.Cascade);
            builder.Entity<SurveyView>().HasMany(s => s.ScreeningQuestionLabels).WithOne().HasForeignKey("SurveyViewScreeningId").OnDelete(DeleteBehavior.Cascade);
            builder.Entity<SurveyView>().ToTable($"{nameof(this.SurveyViews)}");

            builder.Entity<SurveyPermission>().ToTable($"{nameof(this.SurveyPermissions)}");

            builder.Entity<UserGroup>().Property(g => g.Name).IsRequired().HasMaxLength(100);
            builder.Entity<UserGroup>().HasIndex(g => g.Name);
            builder.Entity<UserGroup>().HasOne(g => g.ApiKeySettings).WithOne(k => k.Group).OnDelete(DeleteBehavior.Cascade);
            builder.Entity<UserGroup>().HasMany(g => g.EmailTemplates).WithOne(k => k.Group).OnDelete(DeleteBehavior.Cascade);
            builder.Entity<UserGroup>().ToTable($"{nameof(this.UserGroups)}");

            builder.Entity<ApiKeys>().ToTable($"{nameof(this.ApiKeys)}");

            builder.Entity<EmailTemplate>().ToTable($"{nameof(this.EmailTemplates)}");

            builder.Entity<SiteSurveyTemplate>().ToTable($"{nameof(this.SiteSurveyTemplates)}");

            builder.Entity<GroupMember>().ToTable($"{nameof(this.GroupMembers)}");

            builder.Entity<Shortcode>().ToTable($"{nameof(this.Shortcodes)}");

            builder.Entity<Groupcode>().ToTable($"{nameof(this.Groupcodes)}");


            builder.Entity<QuestionPart>().HasMany(q => q.QuestionConfigurations).WithOne().OnDelete(DeleteBehavior.Cascade);
            builder.Entity<QuestionPart>().HasMany(q => q.QuestionOptions).WithOne(q => q.QuestionPartParent).OnDelete(DeleteBehavior.Cascade);
            builder.Entity<QuestionPart>().HasMany(q => q.QuestionOptionConditionalsSource).WithOne(q => q.SourceQuestion).OnDelete(DeleteBehavior.Cascade);
            builder.Entity<QuestionOption>().HasIndex(o => new { o.Code, o.QuestionPartParentId }).IsUnique(true);
            builder.Entity<QuestionPart>().ToTable($"{nameof(this.QuestionParts)}");
            builder.Entity<QuestionPartView>().HasMany(s => s.Labels).WithOne().HasForeignKey("QuestionPartViewId").OnDelete(DeleteBehavior.Cascade);
            builder.Entity<QuestionPartView>().HasMany(s => s.DescriptionLabels).WithOne().HasForeignKey("QuestionPartViewDescriptionId").OnDelete(DeleteBehavior.Cascade);
            builder.Entity<QuestionPartView>().HasMany(qp => qp.QuestionPartViewChildren).WithOne(qc => qc.ParentView).OnDelete(DeleteBehavior.Cascade);
            builder.Entity<QuestionPartView>().ToTable($"{nameof(this.QuestionPartViews)}");
            builder.Entity<QuestionPart>().HasMany(v => v.Conditionals).WithOne().HasForeignKey(x => x.QuestionId).OnDelete(DeleteBehavior.Cascade);

            builder.Entity<QuestionOption>().HasMany(o => o.QuestionOptionLabels).WithOne().HasForeignKey("QuestionOptionId").OnDelete(DeleteBehavior.Cascade);
            builder.Entity<QuestionOption>().HasMany(q => q.QuestionOptionConditionalsTarget).WithOne(o => o.TargetOption).OnDelete(DeleteBehavior.Cascade);
            builder.Entity<QuestionOption>().ToTable($"{nameof(this.QuestionOptions)}");

            builder.Entity<QuestionConditional>().ToTable($"{nameof(this.QuestionConditionals)}");

            builder.Entity<QuestionOptionConditional>().ToTable($"{nameof(this.QuestionOptionConditionals)}");

            builder.Entity<ResponseValue>().ToTable($"{nameof(this.SurveyResponseValues)}").HasDiscriminator<int>("ResponseType")
                .HasValue<StringResponse>((int)ResponseTypes.StringResponse)
                .HasValue<LocationResponse>((int)ResponseTypes.LocationResponse)
                .HasValue<JsonResponse>((int)ResponseTypes.JsonResponse)
                .HasValue<TimelineResponse>((int)ResponseTypes.TimelineResponse)
                .HasValue<DateTimeResponse>((int)ResponseTypes.DateTimeResponse)
                .HasValue<OptionSelectResponse>((int)ResponseTypes.OptionSelectResponse)
                .HasValue<NumberResponse>((int)ResponseTypes.NumberResponse);

            builder.Entity<TimelineResponse>().Property(x => x.Identifier).IsRequired(false);

            builder.Entity<SurveyResponse>().HasMany(s => s.ResponseValues).WithOne(v => v.SurveyResponse).OnDelete(DeleteBehavior.Cascade);
            builder.Entity<SurveyResponse>().ToTable("SurveyResponses").HasOne(p => p.QuestionPart).WithMany().OnDelete(DeleteBehavior.Cascade);
            builder.Entity<SurveyResponse>().Property(x => x.Excluded).HasDefaultValue(false);
            builder.Entity<SurveyResponse>().Property(x => x.IsPartial).HasDefaultValue(false);
            builder.Entity<SurveyRespondent>().ToTable("SurveyRespondents")
                .HasDiscriminator<int>("RespondentType")
                .HasValue<PrimaryRespondent>(0)
                .HasValue<SubRespondent>(1);

            builder.Entity<PrimaryRespondent>().HasMany(o => o.SurveyAccessRecords).WithOne(o => o.Respondent).OnDelete(DeleteBehavior.Cascade);
            builder.Entity<PrimaryRespondent>().Property(m => m.HomeLocation).IsRequired(false);
            builder.Entity<PrimaryRespondent>().Property(m => m.SurveyAccessDateTime).HasDefaultValue((DateTimeOffset)DateTime.MinValue);
            builder.Entity<SubRespondent>().Property(m => m.HomeLocation).IsRequired(false);
            builder.Entity<PrimaryRespondent>().Property(m => m.HomeAddress).IsRequired(false);
            builder.Entity<SubRespondent>().Property(m => m.HomeAddress).IsRequired(false);
            builder.Entity<PrimaryRespondent>().Property(m => m.Meta).IsRequired(false);
            builder.Entity<SubRespondent>().Property(m => m.Meta).IsRequired(false);
            builder.Entity<SubRespondent>().HasOne(o => o.PrimaryRespondent).WithMany();

            builder.Entity<SurveyRespondentGroup>().ToTable("SurveyRespondentGroups")
                .HasMany(s => s.GroupMembers).WithOne(s => s.SurveyRespondentGroup).OnDelete(DeleteBehavior.Cascade);

            builder.Entity<SurveyRespondentGroup>().HasOne(g => g.GroupPrimaryRespondent).WithOne();

            builder.Entity<SurveyAccessRecord>().ToTable("SurveyAccessRecords");

            builder.Entity<SurveyResponse>().HasOne(o => o.SurveyAccessRecord);


            builder.Entity<QuestionConditionalOperator>().ToTable("QuestionCondtionalOperators")
                .HasOne(s => s.Lhs).WithMany().IsRequired(false).OnDelete(DeleteBehavior.Cascade);
            builder.Entity<QuestionConditionalOperator>().HasOne(s => s.Rhs).WithMany().IsRequired(false).OnDelete(DeleteBehavior.Cascade);

            builder.Entity<QuestionConditional>().HasOne(s => s.SourceQuestion).WithMany();

            builder.Entity<SurveyLogic>().ToTable(nameof(SurveyLogic));
            builder.Entity<SurveyLogic>().HasOne(x => x.Parent).WithMany().HasForeignKey(x => x.ParentId).IsRequired(false).OnDelete(DeleteBehavior.Cascade);
            builder.Entity<SurveyLogic>().HasOne(x => x.Root).WithMany().HasForeignKey(x => x.RootId).IsRequired(false).OnDelete(DeleteBehavior.Cascade);
            builder.Entity<SurveyLogic>().HasOne(x => x.Question).WithMany().HasForeignKey(x => x.QuestionId).OnDelete(DeleteBehavior.Cascade);
            builder.Entity<SurveyLogic>().HasMany(x => x.Expressions).WithOne().OnDelete(DeleteBehavior.Cascade);
            builder.Entity<SurveyLogic>().HasMany(x => x.ValidationMessages).WithOne().HasForeignKey("SurveyLogicId").OnDelete(DeleteBehavior.Cascade);
            builder.Entity<SurveyLogic>().HasOne(x => x.ValidationQuestion).WithMany().OnDelete(DeleteBehavior.Cascade);
            builder.Entity<Survey>().HasMany(x => x.SurveyLogic).WithOne().OnDelete(DeleteBehavior.Cascade);


        }

        public override int SaveChanges()
        {
            UpdateAuditEntities();
            return base.SaveChanges();
        }

        public override int SaveChanges(bool acceptAllChangesOnSuccess)
        {
            UpdateAuditEntities();
            return base.SaveChanges(acceptAllChangesOnSuccess);
        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            UpdateAuditEntities();
            return base.SaveChangesAsync(cancellationToken);
        }

        public override Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess, CancellationToken cancellationToken = default)
        {
            UpdateAuditEntities();
            return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
        }

        private void UpdateAuditEntities()
        {
            var modifiedEntries = ChangeTracker.Entries()
                .Where(x => x.Entity is IAuditableEntity && (x.State == EntityState.Added || x.State == EntityState.Modified));

            var modifiedEntries2 = ChangeTracker.Entries();
            foreach (var entry in modifiedEntries)
            {
                var entity = (IAuditableEntity)entry.Entity;
                DateTime now = DateTime.UtcNow;

                if (entry.State == EntityState.Added)
                {
                    entity.CreatedDate = now;
                    entity.CreatedBy = CurrentUserId;
                }
                else
                {
                    base.Entry(entity).Property(x => x.CreatedBy).IsModified = false;
                    base.Entry(entity).Property(x => x.CreatedDate).IsModified = false;
                }

                entity.UpdatedDate = now;
                entity.UpdatedBy = CurrentUserId;
            }
        }
    }
}
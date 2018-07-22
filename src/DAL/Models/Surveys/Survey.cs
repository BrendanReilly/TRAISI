﻿using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using DAL.Core;
using DAL.Models.Interfaces;
using DAL.Models.Surveys;

namespace DAL.Models.Surveys
{
	public class Survey : AuditableEntity, ISurvey, IEntity
	{
		public int Id { get; set; }
		public int Code { get; set; }
		public string Name { get; set; }
		public string Owner { get; set; }
		public string Group { get; set; }
		public DateTime StartAt { get; set; }
		public DateTime EndAt { get; set; }
		public bool IsActive { get; set; }
		public bool IsOpen { get; set; }
		public string SuccessLink { get; set; }
		public string RejectionLink { get; set; }
		public string DefaultLanguage { get; set; }
		public string StyleTemplate { get; set; }

		public ICollection<SurveyView> SurveyViews { get; set; }
		public ICollection<SurveyPermission> SurveyPermissions { get; set; }
		public ICollection<GroupCode> GroupCodes { get; set; }
		public ICollection<Shortcode> Shortcodes { get; set; }

		public ICollection<TitlePageLabel> TitleLabel { get; set; }

		public Survey()
		{

		}

		public void PopulateDefaults()
		{
			this.DefaultLanguage = "en";
			this.TitleLabel = new HashSet<TitlePageLabel>
						{
								new TitlePageLabel()
								{
										Language = this.DefaultLanguage,
										Value = "Default Welcome",
										Survey = this
								}
						};
			this.SurveyPermissions = new HashSet<SurveyPermission>();
			this.SurveyViews = new List<SurveyView>() {
				new SurveyView () {
					ViewName = "Standard",
					Survey = this,
					WelcomePageLabel = new HashSet<WelcomePageLabel> () {
							new WelcomePageLabel () {
											Language = this.DefaultLanguage,
											Value = "Default Welcome"
							},
							new WelcomePageLabel () {
											Language = "fr",
											Value = "Bonjour"
							}
					},
					ThankYouPageLabel = new HashSet<ThankYouPageLabel> () {
							new ThankYouPageLabel () {
											Language = this.DefaultLanguage,
											Value = "Default Thanks"
							}
					},
					TermsAndConditionsLabel = new HashSet<TermsAndConditionsPageLabel> () {
							new TermsAndConditionsPageLabel () {
											Language = this.DefaultLanguage,
											Value = "Default Terms and Conditions"
							}
					}
				}
			};
		}
	}
}
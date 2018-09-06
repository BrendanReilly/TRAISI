using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Runtime.Serialization.Formatters.Binary;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using TRAISI.SDK;
using TRAISI.SDK.Attributes;
using TRAISI.SDK.Interfaces;

namespace TRAISI.Helpers {
	public class QuestionTypeManager : IQuestionTypeManager {
		private readonly IConfiguration _configuration;

		private readonly ILogger<QuestionTypeManager> _logger;

		private readonly ILoggerFactory _loggerFactory;

		/// <summary>
		/// </summary>
		/// <param name="configuration"></param>
		public QuestionTypeManager(IConfiguration configuration,
			ILoggerFactory loggerFactory) {
			_configuration = configuration;
			_loggerFactory = loggerFactory;

			_logger = loggerFactory.CreateLogger<QuestionTypeManager>();
			QuestionTypeDefinitions = new List<QuestionTypeDefinition>();
		}


		/// <summary>
		/// </summary>
		public void LoadQuestionExtensions() {
			LoadExtensionAssemblies();
			LoadQuestionTypeDefinitions();
		}

		public IList<QuestionTypeDefinition> QuestionTypeDefinitions { get; }


		/// <summary>
		/// </summary>
		/// <param name="questionType"></param>
		/// <param name="attribute"></param>
		/// <param name="sourceAssembly"></param>
		private void CreateQuestionTypeDefinition(Type questionType, SurveyQuestionAttribute attribute,
			Assembly sourceAssembly) {
			var typeDefinition =
				new QuestionTypeDefinition(Activator.CreateInstance(questionType) as ISurveyQuestion, attribute);
			var configurations = ReadQuestionConfigurationData(questionType, sourceAssembly);
			typeDefinition.QuestionConfigurations = configurations;
			var parameterOptions = ReadQuestionOptionData(questionType, sourceAssembly);
			typeDefinition.QuestionOptions = parameterOptions;
			typeDefinition.QuestionPartSlots = ListQuestionSlots(questionType);
			QuestionTypeDefinitions.Add(typeDefinition);


			ReadResponseType(attribute, typeDefinition);
			ReadQuestionResourceData(typeDefinition, questionType, sourceAssembly);

			GetTypeClientData(typeDefinition, sourceAssembly);
		}

		/// <summary>
		/// </summary>
		/// <param name="attribute"></param>
		/// <param name="definition"></param>
		private void ReadResponseType(SurveyQuestionAttribute attribute, QuestionTypeDefinition definition) {
			definition.ResponseType = attribute.QuestionResponseType;
		}


		/// <summary>
		/// </summary>
		/// <param name="questionType"></param>
		/// <returns></returns>
		public List<QuestionPartSlotDefinition> ListQuestionSlots(Type questionType) {
			var list = new List<QuestionPartSlotDefinition>();

			foreach (var att in questionType.GetCustomAttributes(typeof(QuestionPartSlotAttribute)))
				list.Add(new QuestionPartSlotDefinition {
					Description = (att as QuestionPartSlotAttribute).Description,
					Name = (att as QuestionPartSlotAttribute).SlotName,
					SlotOrder = (att as QuestionPartSlotAttribute).SlotOrder
				});


			return list;
		}

		/// <summary>
		/// </summary>
		/// <param name="definition"></param>
		/// <param name="questionType"></param>
		private void ReadQuestionResourceData(QuestionTypeDefinition definition, Type questionType,
			Assembly sourceAssembly) {
			var members = questionType.GetMembers();
			foreach (var member in members) {
				var attributes = member.GetCustomAttributes();
				foreach (var attribute in attributes)
					if (attribute.GetType() == typeof(HasResourceAttribute)) {
						var hasResourceAttribute = (HasResourceAttribute) attribute;

						byte[] data;
						using (var ms = new MemoryStream()) {
							sourceAssembly.GetManifestResourceStream(hasResourceAttribute.ResourceName).CopyTo(ms);
							data = ms.ToArray();
						}

						definition.QuestionResources[hasResourceAttribute.ResourceName] =
							new QuestionResource {
								ResourceName = hasResourceAttribute.ResourceName,
								Data = data,
								FieldName = member.Name
							};
					}
			}
		}

		private byte[] GetQuestionConfigurationData(QuestionConfigurationAttribute configAttribute,
			Assembly sourceAssembly) {
			byte[] data = null;
			if (configAttribute.Resource != null)
				using (var ms = new MemoryStream()) {
					sourceAssembly.GetManifestResourceStream(configAttribute.Resource).CopyTo(ms);
					data = ms.ToArray();
				}

			return data;
		}

		/// <summary>
		///    Returns the QuestionTypeDefinition associated with the passed name
		/// </summary>
		/// <param name="name"></param>
		/// <returns></returns>
		public QuestionTypeDefinition GetQuestionTypeDefinition(string name) {
			return QuestionTypeDefinitions.FirstOrDefault(s => s.TypeName == name);
		}

		/// <summary>
		/// </summary>
		/// <param name="questionType"></param>
		/// <param name="sourceAssembly"></param>
		/// <returns></returns>
		private Dictionary<string, QuestionConfigurationDefinition> ReadQuestionConfigurationData(Type questionType,
			Assembly sourceAssembly) {
			var properties = questionType.GetProperties();
			var members = questionType.GetMembers();
			var configuration = new Dictionary<string, QuestionConfigurationDefinition>();
			foreach (var member in members) {
				var attributes = member.GetCustomAttributes();
				if (attributes.Count() > 0)
					foreach (var attribute in attributes)
						if (attribute.GetType() == typeof(QuestionConfigurationAttribute)) {
							var configAttribute = attribute as QuestionConfigurationAttribute;
							configuration.Add(configAttribute.Name, new QuestionConfigurationDefinition {
									Name = configAttribute.Name,
									Description = configAttribute.Description,
									TypeId = configAttribute.TypeId,
									ValueType = configAttribute.ValueType,
									BuilderType = configAttribute.SurveyBuilderValueType,
									DefaultValue = configAttribute.DefaultValue,
									ResourceData = GetQuestionConfigurationData(configAttribute, sourceAssembly)
								}
							);
						}
			}

			return configuration;
		}

		/// <summary>
		///    Reads the configuration information from the assembly
		/// </summary>
		/// <param name="questionType"></param>
		/// <param name="sourceAssembly"></param>
		/// <returns></returns>
		private Dictionary<string, QuestionOptionDefinition> ReadQuestionOptionData(Type questionType,
			Assembly sourceAssembly) {
			var properties = questionType.GetProperties();
			var members = questionType.GetMembers();
			var configuration = new Dictionary<string, QuestionOptionDefinition>();
			foreach (var member in members) {
				var attributes = member.GetCustomAttributes();
				if (attributes.Count() > 0)
					foreach (var attribute in attributes)
						if (attribute.GetType() == typeof(QuestionOptionAttribute)) {
							var configAttribute = attribute as QuestionOptionAttribute;
							configuration.Add(configAttribute.Name, new QuestionOptionDefinition {
								Name = configAttribute.Name,
								Description = configAttribute.Description,
								ValueType = configAttribute.ValueType,
								IsMultipleAllowed = configAttribute.IsMultipleAllowed,
								TypeId = configAttribute.TypeId
							});
						}
			}

			return configuration;
		}

		/// <summary>
		///    Reads all resource data besides question client (js) data and adds it to the the resource dictionary
		///    The key is either the predefined key or the file name if it was not present
		/// </summary>
		/// <param name="typeDefinition"></param>
		/// <param name="sourceAssembly"></param>
		private void ReadResourceData(QuestionTypeDefinition typeDefinition, Assembly sourceAssembly,
			string[] resources) {
			var resourceNames =
				sourceAssembly.GetManifestResourceNames().Where(r => !r.EndsWith(".module.js")).ToArray();

			var formatter = new BinaryFormatter();
			foreach (var resourceName in resources)
				using (var ms = new MemoryStream()) {
					sourceAssembly.GetManifestResourceStream(resourceName).CopyTo(ms);
					typeDefinition.ResourceData[resourceName] = ms.ToArray();
				}
		}

		/// <summary>
		/// </summary>
		/// <param name="typeDefinition"></param>
		/// <param name="sourceAssembly"></param>
		/// <returns></returns>
		private void GetTypeClientData(QuestionTypeDefinition typeDefinition, Assembly sourceAssembly) {

			var moduleResourceNames = sourceAssembly.GetManifestResourceNames().Where(r => r.EndsWith(".module.js"));

			foreach (var resourceName in moduleResourceNames) {
				using (var ms = new MemoryStream()) {
					sourceAssembly.GetManifestResourceStream(resourceName).CopyTo(ms);


					QuestionTypeDefinition.ClientModules[resourceName] = ms.ToArray();
				}
			}
		}

		/// <summary>
		///    Load all extension (dll) included in the configured extensions directory.
		/// </summary>
		public void LoadExtensionAssemblies() {
			_logger.LogInformation("Loading TRAISI extensions");
			if (!Directory.Exists("extensions")) {
				_logger.LogWarning("Extensions folder does not exist.");
				return;
			}

			//assume from configuration at the moment
			var s = from d in Directory.EnumerateFiles("extensions")
				where d.EndsWith(".dll")
				select d;

			Directory.EnumerateFiles("extensions").Where(file => file.EndsWith("dll")).ToList().ForEach(file => {
				try {
					var loadFrom = Path.Combine(Directory.GetCurrentDirectory(), file);
					Assembly.LoadFile(loadFrom);
					_logger.LogInformation($"Loading extension {Path.GetFileName(file)}");
				}
				catch (Exception e) {
					_logger.LogWarning(e, "Error loading extension assembly.");
				}
			});
		}

		/// <summary>
		/// </summary>
		public void LoadQuestionTypeDefinitions(string loadFrom = ".") {
			var assemblies = AppDomain.CurrentDomain.GetAssemblies();

			foreach (var assembly in assemblies) {
				//only consider TRAISI named modules for speed
				if (!assembly.FullName.Contains("TRAISI", StringComparison.InvariantCultureIgnoreCase)) continue;

				try {
					var types = assembly.GetTypes();
					foreach (var type in types) {
						var e = type.GetCustomAttributes(typeof(SurveyQuestionAttribute));

						foreach (var attribute in e)
							if (attribute.GetType() == typeof(SurveyQuestionAttribute))
								CreateQuestionTypeDefinition(type, (SurveyQuestionAttribute) attribute, assembly);
					}
				}
				catch (Exception e) {
					Console.WriteLine(e.Message);
				}
			}
		}
	}
}
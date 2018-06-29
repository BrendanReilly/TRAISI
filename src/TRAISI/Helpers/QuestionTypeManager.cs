using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using TRAISI.Helpers;
using TRAISI.SDK.Attributes;
using TRAISI.SDK.Interfaces;
using TRAISI.SDK;
namespace TRAISI.Helpers
{

    public class QuestionTypeManager : IQuestionTypeManager
    {
        private IList<QuestionTypeDefinition> _questionTypeDefinitions;

        private IConfiguration _configuration;

        private ILoggerFactory _loggerFactory;

        private ILogger<QuestionTypeManager> _logger;

        /// <summary>
        /// 
        /// </summary>
        /// <param name="configuration"></param>
        public QuestionTypeManager(IConfiguration configuration,
        ILoggerFactory loggerFactory)
        {
            this._configuration = configuration;
            this._loggerFactory = loggerFactory;

            this._logger = loggerFactory.CreateLogger<QuestionTypeManager>();
            _questionTypeDefinitions = new List<QuestionTypeDefinition>();


        }

        /// <summary>
        /// 
        /// </summary>
        public void LoadQuestionExtensions()
        {
            LoadExtensionAssemblies();
            LoadQuestionTypeDefinitions();
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="type"></param>
        /// <param name="attribute"></param>
        private void CreateQuestionTypeDefinition(Type questionType, SurveyQuestionAttribute attribute, Assembly sourceAssembly)
        {
            var typeDefinition = new QuestionTypeDefinition(questionType, attribute);
            var configurations = this.ReadQuestionConfigurationData(questionType, sourceAssembly);
            typeDefinition.QuestionConfigurations = configurations;
            var parameterConfigurations = this.ReadQuestionParameterData(questionType, sourceAssembly);
            typeDefinition.QuestionParameterConfigurations = parameterConfigurations;
            _questionTypeDefinitions.Add(typeDefinition);

            typeDefinition.ClientModules.Add(GetTypeClientData(typeDefinition, sourceAssembly));


        }

        private Dictionary<string, object> ReadQuestionParameterData(Type questionType, Assembly sourceAssembly)
        {
            var properties = questionType.GetProperties();
            var members = questionType.GetMembers();
            var configuration = new Dictionary<string, object>();
            foreach (var member in members)
            {
                var attributes = member.GetCustomAttributes();
                if (attributes.Count() > 0)
                {
                    foreach (var attribute in attributes)
                    {
                        if (attribute.GetType() == typeof(QuestionConfigurationOptionAttribute))
                        {
                            var configAttribute = attribute as QuestionConfigurationOptionAttribute;
                            configuration.Add(configAttribute.ParameterName, configAttribute.TypeId);
                        }

                    }
                }
            }

            return configuration;
        }

        /// <summary>
        /// Reads the configuration information from the assembly
        /// </summary>
        /// <param name="questionType"></param>
        /// <param name="sourceAssembly"></param>
        /// <returns></returns>
        private Dictionary<string, object> ReadQuestionConfigurationData(Type questionType, Assembly sourceAssembly)
        {
            var properties = questionType.GetProperties();
            var members = questionType.GetMembers();
            var configuration = new Dictionary<string, object>();
            foreach (var member in members)
            {
                var attributes = member.GetCustomAttributes();
                if (attributes.Count() > 0)
                {
                    foreach (var attribute in attributes)
                    {
                        if (attribute.GetType() == typeof(QuestionSettingsOptionAttribute))
                        {
                            var configAttribute = attribute as QuestionSettingsOptionAttribute;
                            configuration.Add(configAttribute.ParameterName, configAttribute.TypeId);
                        }
                    }
                }
            }

            return configuration;
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="typeDefinition"></param>
        /// <param name="sourceAssembly"></param>
        /// <returns></returns>
        private byte[] GetTypeClientData(QuestionTypeDefinition typeDefinition, Assembly sourceAssembly)
        {
            string[] resourceNames = sourceAssembly.GetManifestResourceNames();
            string resourceName = sourceAssembly.GetManifestResourceNames().Single(r => r.EndsWith(".module.js"));

            using (MemoryStream ms = new MemoryStream())
            {
                sourceAssembly.GetManifestResourceStream(resourceName).CopyTo(ms);
                return ms.ToArray();
            }
        }

        /// <summary>
        /// Load all extension (dll) included in the configured extensions directory.
        /// </summary>
        public void LoadExtensionAssemblies()
        {
            this._logger.LogInformation("Loading TRAISI extensions");
            if (!Directory.Exists("extensions"))
            {
                this._logger.LogWarning("Extensions folder does not exist.");
                return;
            }
            //assume from configuration at the moment
            var s = from d in Directory.EnumerateFiles("extensions")
                    where d.EndsWith(".dll")
                    select d;

            Directory.EnumerateFiles("extensions").Where(file => file.EndsWith("dll")).ToList<string>().ForEach((file) =>
            {
                try
                {
                    string loadFrom = Path.Combine(Directory.GetCurrentDirectory(), file);
                    Assembly.LoadFile(loadFrom);
                    this._logger.LogInformation($"Loading extension {Path.GetFileName(file)}");
                }
                catch (Exception e)
                {
                    this._logger.LogWarning(e, "Error loading extension assembly.");
                }
            });

            return;
        }

        public IList<QuestionTypeDefinition> QuestionTypeDefinitions { get { return this._questionTypeDefinitions; } }

        /// <summary>
        /// 
        /// </summary>
        public void LoadQuestionTypeDefinitions(string loadFrom = ".")
        {
            Assembly[] assemblies = AppDomain.CurrentDomain.GetAssemblies();

            foreach (var assembly in assemblies)
            {
                try
                {
                    Type[] types = assembly.GetTypes();
                    foreach (var type in types)
                    {

                        var e = type.GetCustomAttributes(typeof(SurveyQuestionAttribute));

                        foreach (var attribute in e)
                        {
                            if (attribute.GetType() == typeof(SurveyQuestionAttribute))
                            {
                                CreateQuestionTypeDefinition(type, (SurveyQuestionAttribute)attribute, assembly);
                            }
                        }

                    }
                }
                catch (Exception e)
                {
                    Console.WriteLine(e.Message);
                }
            }

        }

    }
}
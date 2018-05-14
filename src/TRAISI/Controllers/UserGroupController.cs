﻿// ====================================================
// More Templates: https://www.ebenmonney.com/templates
// Email: support@ebenmonney.com
// ====================================================

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using DAL;
using TRAISI.ViewModels;
using AutoMapper;
using DAL.Core.Interfaces;
using DAL.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;
using TRAISI.Helpers;
using Microsoft.Extensions.Options;

namespace TRAISI.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    public class UserGroupController : Controller
    {

        private IUnitOfWork _unitOfWork;


        /// <summary>
        /// 
        /// </summary>
        /// <param name="_entityManager"></param>
        public UserGroupController(IUnitOfWork unitOfWork)
        {
            this._unitOfWork = unitOfWork;

        }

        /// <summary>
        /// Get user group by ID
        /// </summary>
        [HttpGet("{id}")]
        [Produces(typeof(UserGroupViewModel))]
        public async Task<IActionResult> GetGroup(int id)
        {
            var group =  await this._unitOfWork.UserGroups.GetAsync(id);

            return Ok(Mapper.Map<UserGroupViewModel>(group));
        }
        
        /// <summary>
        /// Get all user group
        /// </summary>
        [HttpGet]
        [Produces(typeof(List<UserGroupViewModel>))]
        public async Task<IActionResult> GetGroups()
        {
            var groups = await this._unitOfWork.UserGroups.GetAllGroupInfoAsync();

            return Ok(Mapper.Map<IEnumerable<UserGroupViewModel>>(groups));
        }

        /// <summary>
        /// Create user group
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateGroup([FromBody] UserGroupViewModel group)
        {
            if (ModelState.IsValid)
            {
                if (group == null)
                {
                    return BadRequest($"{nameof(group)} cannot be null");
                }

                UserGroup appUserGroup = Mapper.Map<UserGroup>(group);

                await this._unitOfWork.UserGroups.AddAsync(appUserGroup);
                await this._unitOfWork.SaveChangesAsync();
                return new OkResult();
            } 

            return BadRequest(ModelState);
        }

        /// <summary>
        /// Update a user group
        /// </summary>
        [HttpPut]
        public async Task<IActionResult> UpdateGroup([FromBody] UserGroupViewModel group)
        {
            UserGroup appUserGroup = Mapper.Map<UserGroup>(group);

            this._unitOfWork.UserGroups.Update(appUserGroup);
            await this._unitOfWork.SaveChangesAsync();
            return new OkResult();
        }

        
        /// <summary>
        /// Delete a user group
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteGroup(int id)
        {
            var removed = this._unitOfWork.UserGroups.Get(id);
            this._unitOfWork.UserGroups.Remove(removed);
            await this._unitOfWork.SaveChangesAsync();
            return new OkResult();
        }

        [HttpGet("{id}/members")]
        [Produces(typeof(List<GroupMemberViewModel>))]
        public async Task<IActionResult> GetGroupMembers(int id)
        {
            var groupMembers = await this._unitOfWork.UserGroups.GetGroupMembersInfoAsync(id);
            List<GroupMemberViewModel> groupMembersVM = new List<GroupMemberViewModel>();

            foreach (var member in groupMembers)
            {
                var groupMemberVM = Mapper.Map<GroupMemberViewModel>(member.Item1);
                groupMemberVM.User.Roles = member.Item2;
                groupMembersVM.Add(groupMemberVM);
            }
            return Ok(groupMembersVM);
        }

        /// <summary>
        /// Adds a new member to the user group
        /// </summary>
        /// <param name="newMember"></param>
        /// <returns></returns>
        [HttpPost("members")]
        public async Task<IActionResult> AddGroupMember([FromBody] GroupMemberViewModel newMember)
        {
            if (ModelState.IsValid)
            {
                GroupMember newGMember = Mapper.Map<GroupMember>(newMember);
                this._unitOfWork.UserGroups.AddUser(newGMember);
                await this._unitOfWork.SaveChangesAsync();
                return new OkResult();
            }
            return BadRequest(ModelState);
        }

        [HttpDelete("members/{id}")]
        public async Task<IActionResult> RemoveGroupMember(int id)
        {
            if (ModelState.IsValid)
            {
                var member = this._unitOfWork.GroupMembers.Get(id);
                this._unitOfWork.GroupMembers.Remove(member);
                await this._unitOfWork.SaveChangesAsync();
                return new OkResult();
            }
            return BadRequest(ModelState);
        }
    }
}

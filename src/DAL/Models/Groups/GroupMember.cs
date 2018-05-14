﻿using System;
using System.Collections.Generic;
using System.Text;

namespace DAL.Models
{
    public class GroupMember
    {
        public int Id { get; set; }
        public string UserName { get; set; }
        public ApplicationUser User { get; set; }
        public string Group { get; set; }
        public UserGroup UserGroup { get; set; }
        public DateTime DateJoined { get; set; }
        public Boolean GroupAdmin { get; set; }
    }
}

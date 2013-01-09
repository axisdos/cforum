# -*- encoding: utf-8 -*-

class CfForum < ActiveRecord::Base
  self.primary_key = 'forum_id'
  self.table_name  = 'forums'

  has_many :threads, class_name: 'CfThread', :foreign_key => :forum_id, :dependent => :destroy

  has_many :tags, class_name: 'CfTag', :foreign_key => :forum_id, :dependent => :destroy

  has_many :forums_groups_permissions, class_name: 'CfForumGroupPermission', :foreign_key => :forum_id, :dependent => :destroy

  attr_accessible :forum_id, :slug, :name, :short_name, :description, :updated_at, :created_at, :public

  validates :slug, uniqueness: true, length: {:in => 1..20}, allow_blank: false, format: {with: /^[a-z0-9_-]+$/}
  validates :name, length: {:minimum => 3}, allow_blank: false
  validates :short_name, length: {:in => 1..50}

  def to_param
    slug
  end

  def moderator?(user)
    return false if user.blank?
    return true if user.admin?

    forum_permissions.each do |p|
      return true if p.user_id == user.user_id and p.permission == CfForumPermission::ACCESS_MODERATOR
    end

    return false
  end

  def write?(user)
    return true if public?
    return false if user.blank?
    return true if user.admin?

    forum_permissions.each do |p|
      return true if p.user_id == user.user_id and (p.permission == CfForumPermission::ACCESS_WRITE or p.permission == CfForumPermission::ACCESS_MODERATOR)
    end

    return false
  end

  def read?(user)
    return true if public?
    return false if user.blank?
    return true if user.admin?

    forum_permissions.each do |p|
      return true if p.user_id == user.user_id
    end

    return false
  end

  #default_scope where('public = true')
end

# eof

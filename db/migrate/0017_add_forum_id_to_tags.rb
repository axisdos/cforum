# -*- coding: utf-8 -*-

class CfTag < ActiveRecord::Base
  self.primary_key = 'tag_id'
  self.table_name  = 'tags'

  has_many :tags_threads, class_name: 'CfTagThread', :foreign_key => :tag_id, :dependent => :destroy
  has_many :threads, class_name: 'CfThread', :through => :tags_threads
  belongs_to :forum, class_name: 'CfForum', :foreign_key => :forum_id

  validates_presence_of :tag_name, :forum_id
  validates :tag_name, length: {:in => 2..50}

  def to_param
    slug
  end

  before_create do |t|
    t.slug = t.tag_name.parameterize
  end
end

class CfTagThread < ActiveRecord::Base
  self.primary_key = 'tag_thread_id'
  self.table_name  = 'tags_threads'

  belongs_to :thread, class_name: 'CfThread', :foreign_key => :thread_id
  belongs_to :tag, class_name: 'CfTag', :foreign_key => :tag_id

  validates_presence_of :tag_id, :thread_id
end

class AddForumIdToTags < ActiveRecord::Migration
  def up
    execute <<-SQL
ALTER TABLE tags ADD COLUMN forum_id BIGINT REFERENCES forums (forum_id) ON UPDATE CASCADE ON DELETE CASCADE;
DROP INDEX tags_tag_name_idx;
CREATE UNIQUE INDEX tags_forum_id_tag_name_idx ON tags (forum_id, tag_name);
    SQL

    tag_threads = CfTagThread.includes(:thread).all
    tag_threads.each do |tt|
      puts "--- working on " + tt.tag.tag_name
      if tt.tag.forum_id.nil?
        tt.tag.forum_id = tt.thread.forum_id
        tt.tag.save
        next
      end

      if tt.tag.forum_id != tt.thread.forum_id
        CfTag.transaction do
          tag = CfTag.find_by_forum_id_and_tag_name tt.thread.forum_id, tt.tag.tag_name
          tag = CfTag.create!(tag_name: tt.tag.tag_name, forum_id: tt.thread.forum_id) if tag.blank?

          tt.tag_id = tag.tag_id
          tt.save
        end
      end
    end

    execute "ALTER TABLE tags ALTER COLUMN forum_id SET NOT NULL;"
  end

  def down
    execute <<-SQL
DROP INDEX tags_forum_id_tag_name_idx;
CREATE UNIQUE INDEX tags_tag_name_idx ON tags (tag_name);
ALTER TABLE tags DROP COLUMN forum_id;
    SQL
  end
end

# eof

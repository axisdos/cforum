# -*- coding: utf-8 -*-

class FixAdminFlag < ActiveRecord::Migration
  def up
    execute <<-SQL
ALTER TABLE users ALTER COLUMN admin TYPE BOOLEAN USING CASE WHEN 't' THEN true ELSE false END;
    SQL
  end

  def down
    execute <<-SQL
ALTER TABLE users ALTER COLUMN admin TYPE CHARACTER VARYING(255);
    SQL
  end
end

# eof

# -*- coding: utf-8 -*-

module ApplicationHelper
  include CForum::Tools

  def current_forum
    unless params[:curr_forum].blank?
      @_current_forum = CfForum.find_by_slug(params[:curr_forum]) if !@_current_forum || @_current_forum.slug != params[:curr_forum]
      raise CForum::NotFoundException.new unless @_current_forum # TODO: error description
      return @_current_forum
    end

    @_current_forum = nil
  end

  def date_format(type = 'date_format_default', standard = '%d.%m.%Y %H:%M')
    uconf(type, standard)
  end
end

require 'pp'
class Object
  def pp_inspect
    PP.pp(self, "")
  end
end


# eof

class Plugin
  def initialize(app_controller)
    @app_controller = app_controller
  end

  def notify(name, *args)
    if respond_to?(name.to_sym)
      send(name.to_sym, *args)
    else
      raise CForum::NotFoundException.new # TODO: more specific exception
    end
  end

  def set(name, val)
    @app_controller.set(name, val)
  end

  def get(name)
    @app_controller.get(name)
  end

  def current_user
    @app_controller.current_user
  end

  def current_forum
    @app_controller.current_forum
  end

  def params
    @app_controller.params
  end

  def conf(name, default = nil)
    @app_controller.conf(name, default)
  end

  def uconf(name, default = nil)
    @app_controller.uconf(name, default)
  end

  def register_plugin_api(name, &block)
    @app_controller.register_plugin_api(name, &block)
  end

  def get_plugin_api(name)
    @app_controller.get_plugin_api(name)
  end
end

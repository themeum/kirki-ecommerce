<?php

namespace Kirki\Ecommerce\Console;

use RuntimeException;

use function Kirki\Ecommerce\app;

class CommandManager
{
    /**
     * The base command name
     *
     * @var string
     */
    protected $command_base = 'kirki';

    /**
     * Register a command
     *
     * @param string $name
     * @param mixed $command
     * @return void
     */
    public function register(string $name, $command)
    {
        $command = $this->resolve($command);
        $args = $command->args();

        \WP_CLI::add_command($this->make($name), $command, $args);
    }

    /**
     * Resolve the command
     *
     * @param mixed $command
     * @return CommandBase
     */
    protected function resolve($command)
    {
        if (is_object($command)) {
            if (!$command instanceof CommandBase) {
                throw new RuntimeException(sprintf("Command [%s] must extend [%s]", get_class($command), CommandBase::class));
            }

            return $command;
        }

        if (!class_exists($command)) {
            throw new RuntimeException(sprintf("Command class [%s] not found", $command));
        }

        return app()->make($command);
    }

    /**
     * Make the command name
     *
     * @param string $command
     * @return string
     */
    protected function make($command)
    {
        return sprintf('%s %s', $this->command_base, $command);
    }
}

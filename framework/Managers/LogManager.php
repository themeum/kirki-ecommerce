<?php

namespace Kirki\Ecommerce\Managers;

use DateTime;
use Kirki\Ecommerce\Supports\Facades\File;

use function Kirki\Ecommerce\base_path;

class LogManager
{
    protected string $path;

    public function __construct(?string $path = null)
    {
        $this->path = $path ?? base_path('kirki-ecommerce.log');
    }

    /**
     * Log a debug message.
     *
     * @param string $message
     * @return void
     */
    public function debug($message)
    {
        $this->write($message, 'debug');
    }

    /**
     * Log an info message.
     *
     * @param string $message
     * @return void
     */
    public function info($message)
    {
        $this->write($message, 'info');
    }

    /**
     * Log a warning message.
     *
     * @param string $message
     * @return void
     */
    public function warning($message)
    {
        $this->write($message, 'warning');
    }

    /**
     * Log an error message.
     *
     * @param string $message
     * @return void
     */
    public function error($message)
    {
        $this->write($message, 'error');
    }

    /**
     * Log an emergency message.
     *
     * @param string $message
     * @return void
     */
    public function emergency($message)
    {
        $this->write($message, 'emergency');
    }

    /**
     * Log a critical message.
     *
     * @param string $message
     * @return void
     */
    public function critical($message)
    {
        $this->write($message, 'critical');
    }

    /**
     * Log an alert message.
     *
     * @param string $message
     * @return void
     */
    public function alert($message)
    {
        $this->write($message, 'alert');
    }

    /**
     * Clear the log file.
     *
     * @return void
     */
    public function clear()
    {
        @file_put_contents($this->path, '');
    }

    /**
     * Format the message.
     *
     * @param string $message
     * @param string $type
     * @return string
     */
    protected function format($message, $type)
    {
        return sprintf(
            "[%s] [%s] %s\n",
            (new DateTime())->format('Y-m-d H:i:s'),
            strtoupper($type),
            $message,
        );
    }

    /**
     * Write the message to the log file.
     *
     * @param string $message
     * @param string $type
     * @return void
     */
    protected function write($message, $type)
    {
        File::make_dir($this->path);
        @file_put_contents($this->path, $this->format($message, $type), FILE_APPEND);
    }
}

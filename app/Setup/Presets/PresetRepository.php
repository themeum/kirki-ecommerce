<?php

namespace Kirki\Ecommerce\App\Setup\Presets;

use Kirki\Ecommerce\Framework\Supports\Facades\Log;

use function Kirki\Ecommerce\Framework\json_decoded_data;
use function Kirki\Ecommerce\Framework\resource_path;

defined('ABSPATH') || exit;

/**
 * Reads the bundled preset data file that the local preset source builds from.
 *
 * @since 1.0.0
 */
class PresetRepository
{
    /** @var string */
    protected $file_path;

    /** @var array<string, mixed>|null */
    protected $data = null;

    /**
     * Create the repository for a preset data file.
     *
     * @since 1.0.0
     *
     * @param string|null $file_path Absolute path to the preset JSON; the bundled file when null.
     */
    public function __construct($file_path = null)
    {
        $this->file_path = $file_path ?? resource_path('data/preconfigured-data.json');
    }

    /**
     * Get the presets that apply to every store.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed>
     */
    public function get_common()
    {
        return $this->load()['common'] ?? [];
    }

    /**
     * Get the presets for an industry.
     *
     * @since 1.0.0
     *
     * @param string $slug Industry slug.
     * @return array<string, mixed> Empty for "other" or an industry with no entry.
     */
    public function get_industry(string $slug)
    {
        return $this->load()['industries'][$slug] ?? [];
    }

    /**
     * Get the presets for a country.
     *
     * @since 1.0.0
     *
     * @param string $code ISO 3166-1 alpha-2 country code.
     * @return array<string, mixed> Empty for a country with no entry.
     */
    public function get_country(string $code)
    {
        return $this->load()['countries'][strtoupper($code)] ?? [];
    }

    /**
     * Get the member country codes of a trade bloc.
     *
     * @since 1.0.0
     *
     * @param string $code Bloc code, such as "EU".
     * @return string[] Empty for an unknown bloc.
     */
    public function get_bloc(string $code)
    {
        return $this->load()['blocs'][$code] ?? [];
    }

    /**
     * Get every country entry, keyed by country code.
     *
     * @since 1.0.0
     *
     * @return array<string, array<string, mixed>>
     */
    public function get_countries()
    {
        return $this->load()['countries'] ?? [];
    }

    /**
     * Get every industry entry, keyed by industry slug.
     *
     * @since 1.0.0
     *
     * @return array<string, array<string, mixed>>
     */
    public function get_industries()
    {
        return $this->load()['industries'] ?? [];
    }

    /**
     * Decode the data file once; an unreadable file yields no presets.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed>
     */
    protected function load()
    {
        if ($this->data !== null) {
            return $this->data;
        }

        $data = json_decoded_data($this->file_path);

        if (!is_array($data)) {
            Log::warning(sprintf('Store presets could not be read from %s', $this->file_path));
            $data = [];
        }

        $this->data = $data;

        return $this->data;
    }
}

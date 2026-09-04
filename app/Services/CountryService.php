<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\DTO\Country\CountryFilterDTO;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Http\Response;

use function Kirki\Ecommerce\Framework\collection;
use function Kirki\Ecommerce\Framework\json_decoded_data;
use function Kirki\Ecommerce\Framework\resource_path;

class CountryService
{
    protected $data = [];

    public function __construct()
    {
        $this->load_data();
    }

    public function all(CountryFilterDTO $filters)
    {
        if (!empty($filters->group)) {
            $this->data = collection($this->data)->filter(fn($country) => $country['group'] === $filters->group)->all();
        }

        return $this->data;
    }

    public function find(string $code)
    {
        $country = $this->find_by_code($code);

        if (!$country) {
            throw new NotFoundException(__('Country not found.', 'kirki-ecommerce'), Response::NOT_FOUND); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Caught centrally in Route.php; ApiExceptionHandler puts the message into a JSON response (HTML-escaping would corrupt it) and SiteExceptionHandler already calls esc_html() once before wp_die().
        }

        return $country;
    }

    protected function find_by_code(string $code)
    {
        $code = strtoupper($code);

        foreach ($this->data as $country) {
            if (strtoupper($country['code']) === $code) {
                return $country;
            }
        }

        return null;
    }

    protected function load_data()
    {
        $this->data = json_decoded_data(resource_path('data/countries.json')) ?? [];
    }
}

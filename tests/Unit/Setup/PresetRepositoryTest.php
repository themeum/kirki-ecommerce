<?php

namespace Kirki\Ecommerce\Tests\Unit\Setup;

use Kirki\Ecommerce\App\Setup\Presets\PresetRepository;
use Kirki\Ecommerce\App\Supports\CountryData;
use Kirki\Ecommerce\Framework\Managers\LogManager;
use Kirki\Ecommerce\Tests\Unit\TestCase;

/**
 * Guards the shape and the internal references of the bundled preset data.
 */
class PresetRepositoryTest extends TestCase
{
    /** @var string[] */
    protected $temporary_files = [];

    protected function setUp(): void
    {
        parent::setUp();

        $this->bootstrap_application()->instance(LogManager::class, new class {
            public function __call($method, $arguments)
            {
            }
        });
        CountryData::flush();
    }

    protected function tearDown(): void
    {
        foreach ($this->temporary_files as $file) {
            @unlink($file);
        }

        parent::tearDown();
    }

    public function test_sections_are_read_from_the_bundled_file(): void
    {
        $repository = new PresetRepository();

        $this->assertNotEmpty($repository->get_common()['attributes']);
        $this->assertNotEmpty($repository->get_industry('fashion-and-apparel'));
        $this->assertNotEmpty($repository->get_country('gb'));
        $this->assertCount(27, $repository->get_bloc('EU'));
    }

    public function test_unknown_entries_are_empty(): void
    {
        $repository = new PresetRepository();

        $this->assertSame([], $repository->get_industry('other'));
        $this->assertSame([], $repository->get_country('ZZ'));
        $this->assertSame([], $repository->get_bloc('NOPE'));
    }

    public function test_missing_file_yields_no_presets(): void
    {
        $repository = new PresetRepository(sys_get_temp_dir() . '/kirki-presets-missing-' . uniqid() . '.json');

        $this->assertSame([], $repository->get_common());
        $this->assertSame([], $repository->get_country('GB'));
    }

    public function test_invalid_json_yields_no_presets(): void
    {
        $file = tempnam(sys_get_temp_dir(), 'kirki-presets-');
        $this->temporary_files[] = $file;
        file_put_contents($file, '{ not json');

        $repository = new PresetRepository($file);

        $this->assertSame([], $repository->get_common());
        $this->assertSame([], $repository->get_industry('fashion-and-apparel'));
    }

    public function test_every_tax_entry_records_its_source_and_verification_date(): void
    {
        foreach ((new PresetRepository())->get_countries() as $code => $country) {
            if (empty($country['tax'])) {
                continue;
            }

            $this->assertNotEmpty($country['tax']['source'] ?? $country['tax']['sources'] ?? null, "{$code} tax has no source");
            $this->assertMatchesRegularExpression('/^\d{4}-\d{2}-\d{2}$/', $country['tax']['verified_at'] ?? '', "{$code} tax has no verified_at date");
        }
    }

    public function test_country_codes_and_state_ids_exist_in_the_country_dataset(): void
    {
        $repository = new PresetRepository();
        $index = CountryData::index();

        foreach ($repository->get_countries() as $code => $country) {
            $this->assertArrayHasKey($code, $index, "{$code} is not in the country dataset");

            $state_ids = array_map('strval', array_column(CountryData::states_for($code), 'id'));

            foreach (array_keys($country['tax']['states'] ?? []) as $state_id) {
                $this->assertContains((string) $state_id, $state_ids, "{$code} state {$state_id} is not in the country dataset");
            }
        }
    }

    public function test_eu_bloc_matches_the_country_dataset(): void
    {
        $dataset_members = [];

        foreach (CountryData::index() as $code => $country) {
            if (($country['group'] ?? null) === 'eu') {
                $dataset_members[] = $code;
            }
        }

        $bloc = (new PresetRepository())->get_bloc('EU');
        sort($bloc);
        sort($dataset_members);

        $this->assertSame($dataset_members, $bloc);
    }

    public function test_every_eu_member_has_a_standard_rate(): void
    {
        $repository = new PresetRepository();

        foreach ($repository->get_bloc('EU') as $code) {
            $tax = $repository->get_country($code)['tax'] ?? [];

            $this->assertSame('eu', $tax['mode'] ?? null, "{$code} is not in eu tax mode");
            $this->assertGreaterThan(0, $tax['rate'] ?? 0, "{$code} has no standard rate");
        }
    }

    public function test_every_named_bloc_exists(): void
    {
        $repository = new PresetRepository();

        foreach ($repository->get_countries() as $code => $country) {
            if (empty($country['bloc'])) {
                continue;
            }

            $this->assertContains($code, $repository->get_bloc($country['bloc']), "{$code} is not a member of its bloc {$country['bloc']}");
        }
    }

    public function test_profile_references_resolve_to_known_profile_keys(): void
    {
        $repository = new PresetRepository();
        $common = $repository->get_common();
        $common_shipping_keys = array_column($common['shipping_profiles'], 'key');
        $all_tax_keys = array_column($common['tax_profiles'], 'key');

        foreach ($repository->get_industries() as $slug => $industry) {
            $shipping_keys = array_merge($common_shipping_keys, array_column($industry['shipping_profiles'] ?? [], 'key'));
            $all_tax_keys = array_merge($all_tax_keys, array_column($industry['tax_profiles'] ?? [], 'key'));

            foreach ($industry['shipping_rules'] ?? [] as $rule) {
                $this->assertContains($rule['profile'], $shipping_keys, "{$slug} rule uses unknown shipping profile {$rule['profile']}");
            }
        }

        foreach ($repository->get_countries() as $code => $country) {
            $rate_keys = array_keys($country['tax']['profile_rates'] ?? []);

            foreach ($country['tax']['states'] ?? [] as $state) {
                $rate_keys = array_merge($rate_keys, array_keys($state['profile_rates'] ?? []));
            }

            foreach ($rate_keys as $profile_key) {
                $this->assertContains($profile_key, $all_tax_keys, "{$code} has a rate for unknown tax profile {$profile_key}");
            }
        }
    }

    public function test_shipping_rules_target_only_preset_zone_kinds(): void
    {
        foreach ((new PresetRepository())->get_industries() as $slug => $industry) {
            foreach ($industry['shipping_rules'] ?? [] as $rule) {
                $this->assertNotEmpty($rule['zones'], "{$slug} rule targets no zone");
                $this->assertSame([], array_values(array_diff($rule['zones'], ['*', 'domestic', 'regional'])), "{$slug} rule targets an unknown zone kind");
            }
        }
    }

    public function test_every_industry_has_a_two_level_category_tree(): void
    {
        foreach ((new PresetRepository())->get_industries() as $slug => $industry) {
            $this->assertNotEmpty($industry['categories'] ?? [], "{$slug} has no categories");

            foreach ($industry['categories'] as $category) {
                $this->assertNotEmpty($category['name'], "{$slug} has a category with no name");

                foreach ($category['children'] ?? [] as $child) {
                    $this->assertNotEmpty($child['name'], "{$slug} has a subcategory with no name");
                    $this->assertArrayNotHasKey('children', $child, "{$slug} category tree is deeper than two levels");
                }
            }
        }
    }

    public function test_every_onboarding_industry_has_an_entry(): void
    {
        $steps = file_get_contents(static::plugin_path() . '/resources/app/features/onboarding/lib/steps.ts');
        preg_match_all("/value: '([a-z-]+)'/", $steps, $matches);
        $slugs = array_values(array_diff($matches[1], ['other']));

        $this->assertNotEmpty($slugs);

        $industries = (new PresetRepository())->get_industries();

        foreach ($slugs as $slug) {
            $this->assertArrayHasKey($slug, $industries, "Industry {$slug} has no preset entry");
        }

        $this->assertSame([], array_values(array_diff(array_keys($industries), $slugs)), 'Preset industries that onboarding does not offer');
    }

    public function test_consent_page_tokens_resolve_to_preset_pages(): void
    {
        $legal = (new PresetRepository())->get_common()['legal'];
        $page_keys = array_column($legal['pages'], 'key');

        foreach ($legal['consents'] as $consent) {
            $messages = [$consent['message'], $consent['gdpr']['message'] ?? ''];

            foreach ($messages as $message) {
                preg_match_all('/\{page:([a-z_]+)\}/', $message, $matches);

                foreach ($matches[1] as $page_key) {
                    $this->assertContains($page_key, $page_keys, "{$consent['key']} consent links to unknown page {$page_key}");
                }
            }
        }
    }
}

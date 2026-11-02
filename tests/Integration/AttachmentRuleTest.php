<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Rules\AttachmentRule;
use WP_UnitTestCase;

class AttachmentRuleTest extends WP_UnitTestCase
{
    /**
     * Create an attachment with the given MIME type.
     *
     * @param string $mime_type The attachment MIME type.
     * @return int The attachment ID.
     * @since 1.0.0
     */
    protected function attachment(string $mime_type): int
    {
        return (int) self::factory()->attachment->create(['post_mime_type' => $mime_type]);
    }

    /**
     * Build the rule for a value.
     *
     * @param string[] $types The accepted types.
     * @param mixed    $value The value to validate.
     * @return AttachmentRule The rule, not yet validated.
     * @since 1.0.0
     */
    protected function make_rule(array $types, $value): AttachmentRule
    {
        return AttachmentRule::of($types)->with_name('media.0')->with_value($value);
    }

    /**
     * Image attachment passes the images-only list.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_image_attachment_passes(): void
    {
        $rule = $this->make_rule(['image'], $this->attachment('image/jpeg'));

        $this->assertTrue($rule->passed());
        $this->assertSame([], $rule->messages());
    }

    /**
     * Video and audio attachments fail the images-only list.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_video_and_audio_attachments_fail(): void
    {
        foreach (['video/mp4', 'audio/mpeg'] as $mime_type) {
            $rule = $this->make_rule(['image'], $this->attachment($mime_type));

            $this->assertFalse($rule->passed(), $mime_type);
            $this->assertSame(['The selected file must be of type: image.'], $rule->messages());
        }
    }

    /**
     * An ID that is not an attachment fails.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_non_attachment_fails(): void
    {
        $post_id = self::factory()->post->create();

        foreach ([$post_id, 999999, 0, 'abc'] as $value) {
            $rule = $this->make_rule(['image'], $value);

            $this->assertFalse($rule->passed(), (string) $value);
            $this->assertSame(['The selected file does not exist.'], $rule->messages());
        }
    }

    /**
     * A full MIME type matches exactly.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_full_mime_type_matches_exactly(): void
    {
        $pdf = $this->attachment('application/pdf');
        $zip = $this->attachment('application/zip');

        $this->assertTrue($this->make_rule(['application/pdf'], $pdf)->passed());
        $this->assertFalse($this->make_rule(['application/pdf'], $zip)->passed());
    }

    /**
     * A bare type does not match a similarly prefixed type.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_bare_type_does_not_match_prefix_of_another_type(): void
    {
        $this->assertFalse($this->make_rule(['image'], $this->attachment('imagery/x'))->passed());
    }

    /**
     * Widening the list accepts the added type and still rejects others.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_widened_list_accepts_added_type(): void
    {
        $video = $this->attachment('video/mp4');
        $audio = $this->attachment('audio/mpeg');

        $this->assertTrue($this->make_rule(['image', 'video'], $video)->passed());
        $this->assertFalse($this->make_rule(['image', 'video'], $audio)->passed());
    }
}

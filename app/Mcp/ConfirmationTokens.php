<?php

namespace Kirki\Ecommerce\App\Mcp;

defined('ABSPATH') || exit;

/**
 * Keeps the short-lived tokens that confirm a previewed change of a write tool.
 *
 * A token works one time, for the user, the tool and the arguments of its preview.
 *
 * @since 1.0.0
 */
class ConfirmationTokens
{
    const LIFETIME = 600;

    const TRANSIENT_PREFIX = 'kirki_ecommerce_mcp_token_';

    /**
     * Make a token for a previewed change.
     *
     * @since 1.0.0
     *
     * @param string               $tool        Tool name.
     * @param int                  $user_id     User who made the preview.
     * @param array<string, mixed> $arguments   Validated tool arguments, without the token.
     * @param string               $fingerprint Hash of the target record when the preview was made.
     *
     * @return string The token.
     */
    public function issue(string $tool, int $user_id, array $arguments, string $fingerprint)
    {
        $token = wp_generate_password(32, false);

        set_transient($this->key($token), [
            'user_id' => $user_id,
            'tool' => $tool,
            'arguments_hash' => $this->arguments_hash($arguments),
            'fingerprint' => $fingerprint,
        ], static::LIFETIME);

        return $token;
    }

    /**
     * Use up a token and get the fingerprint of its preview.
     *
     * The token is removed first, so it works one time also when the change fails.
     *
     * @since 1.0.0
     *
     * @param string               $token     Token from the preview.
     * @param string               $tool      Tool name.
     * @param int                  $user_id   User who sends the token.
     * @param array<string, mixed> $arguments Validated tool arguments, without the token.
     *
     * @return string|null The fingerprint of the preview. Null when the token is not valid for this call.
     */
    public function claim(string $token, string $tool, int $user_id, array $arguments)
    {
        $key = $this->key($token);
        $stored = get_transient($key);

        if (!is_array($stored) || !delete_transient($key)) {
            return null;
        }

        $is_match = (int) $stored['user_id'] === $user_id
            && $stored['tool'] === $tool
            && hash_equals((string) $stored['arguments_hash'], $this->arguments_hash($arguments));

        return $is_match ? (string) $stored['fingerprint'] : null;
    }

    /**
     * Get the time when a token made now stops being valid.
     *
     * @since 1.0.0
     *
     * @return int Unix time.
     */
    public function expires_at()
    {
        return time() + static::LIFETIME;
    }

    /**
     * Hash the arguments, with the keys sorted at each level.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $arguments Tool arguments.
     *
     * @return string
     */
    public function arguments_hash(array $arguments)
    {
        return hash('sha256', (string) wp_json_encode($this->sorted($arguments)));
    }

    /**
     * Sort the keys of a map at each level. Lists keep their order.
     *
     * @since 1.0.0
     *
     * @param mixed $value Value to sort.
     *
     * @return mixed
     */
    protected function sorted($value)
    {
        if (!is_array($value)) {
            return $value;
        }

        if (array_keys($value) !== range(0, count($value) - 1)) {
            ksort($value);
        }

        return array_map([$this, 'sorted'], $value);
    }

    /**
     * Get the transient key of a token.
     *
     * @since 1.0.0
     *
     * @param string $token Token.
     *
     * @return string
     */
    protected function key(string $token)
    {
        return static::TRANSIENT_PREFIX . hash('sha256', $token);
    }
}

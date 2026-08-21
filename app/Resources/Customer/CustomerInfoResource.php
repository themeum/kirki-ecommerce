<?php

namespace Kirki\Ecommerce\App\Resources\Customer;

use Kirki\Ecommerce\Framework\Resource;
use Kirki\Ecommerce\Framework\Supports\MediaAttachment;

class CustomerInfoResource extends Resource
{
    public function to_array()
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'email' => $this->email,
            'phone' => $this->phone,
            'photo' => MediaAttachment::make($this->photo),
        ];
    }
}
